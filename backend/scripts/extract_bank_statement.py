import json
import re
import sys
from collections import defaultdict
from datetime import datetime

try:
    import pdfplumber
except ImportError:
    print(json.dumps({"error": "pdfplumber is not installed"}))
    sys.exit(1)

DEBUG = '--debug' in sys.argv


def dbg(*args):
    if DEBUG:
        print('[DEBUG]', *args, file=sys.stderr)


# ----- patterns -----

# Common bank-statement date formats. Year is optional for month-name forms
# so "15 Jan" / "Apr 08" can be resolved later via the statement year.
DATE_RE = re.compile(
    r'\b('
    r'\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}'
    r'|\d{4}[\/\-]\d{2}[\/\-]\d{2}'
    r'|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*(?:\s+\d{4})?'
    r'|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}(?:,?\s+\d{4})?'
    r')\b',
    re.IGNORECASE,
)

# Money like "$45.67" or "1,234.56" with optional DR/CR suffix.
AMOUNT_RE = re.compile(
    r'(?<![0-9,.])\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+\.\d{1,2})\s*(DR|CR)?(?![0-9,.])',
    re.IGNORECASE,
)

# Stricter money pattern requiring ".cc" — used for the RBC AMOUNT column,
# where stray footer text (e.g. "MAY 29, 2026") shares the same x-band.
MONEY_STRICT_RE = re.compile(r'\$?(\d{1,3}(?:,\d{3})*\.\d{2})\b')

YEAR_RE = re.compile(r'\b(20\d{2})\b')

# Maps canonical column name → header-text regex. Multi-word forms (RBC's
# "TRANSACTION DATE", "ACTIVITY DESCRIPTION", "AMOUNT ($)") match either as
# full table cells (Strategy 2) or by their distinctive word (Strategy 1).
COLUMN_KEYWORDS = {
    'date':        re.compile(r'^(transaction\s+date|posting\s+date|date|dt)$', re.I),
    'description': re.compile(r'^(activity\s+description|description|details|particulars|narrative|memo|reference)$', re.I),
    'withdrawal':  re.compile(r'^(amount\s*(?:\(\$\))?|amt|withdrawal|withdrawals|withdraw|debit|debits|payment|payments|dr)$', re.I),
    'deposit':     re.compile(r'^(deposit|deposits|credit|credits|receipt|receipts|cr)$', re.I),
    'balance':     re.compile(r'^(balance|bal)$', re.I),
}

# Account-summary lines that must never become expense rows.
SKIP_RE = re.compile(
    r'^\s*(opening\s+balance|closing\s+balance|brought\s+forward|carried\s+forward'
    r'|subtotal|total|grand\s+total'
    r'|statement\s+period|billing\s+period|account\s+summary)\b',
    re.IGNORECASE,
)

# Strategy 3 uses this to skip header lines that resemble transaction rows.
HEADER_ROW_RE = re.compile(
    r'^\s*(transaction\s+(date|period)|posting\s+date|activity\s+description'
    r'|date|description|details|debit|credit|withdrawal|deposit|balance|amount)\b',
    re.IGNORECASE,
)


# ----- shared helpers -----

def extract_statement_year(text):
    years = YEAR_RE.findall(text or '')
    return int(years[0]) if years else None


def normalize_date(raw, statement_year=None):
    """Parse a raw date string into YYYY-MM-DD, or None if unparseable.

    Title-cases month-name tokens so locale-sensitive %b accepts uppercase
    inputs like 'APR 7' from TD statements.
    """
    raw = re.sub(r'\s+', ' ', raw.strip())
    title_raw = ' '.join(p.capitalize() if p.isalpha() else p for p in raw.split())
    candidates = (title_raw, raw)

    for fmt in ('%d/%m/%Y', '%m/%d/%Y', '%d-%m-%Y', '%Y-%m-%d',
                '%d %b %Y', '%d %B %Y', '%b %d, %Y', '%B %d, %Y',
                '%d/%m/%y', '%m/%d/%y', '%d-%m-%y'):
        for candidate in candidates:
            try:
                dt = datetime.strptime(candidate, fmt)
                if dt.year >= 2000:
                    return dt.strftime('%Y-%m-%d')
            except ValueError:
                pass
    if statement_year:
        for fmt in ('%d %b', '%d %B', '%b %d', '%B %d', '%d/%m', '%m/%d'):
            for candidate in candidates:
                try:
                    return datetime.strptime(candidate, fmt).replace(year=statement_year).strftime('%Y-%m-%d')
                except ValueError:
                    pass
    return None


def parse_amount(text):
    """Return positive float < 1M from text; zero or out-of-range → None."""
    cleaned = re.sub(r'[^\d.]', '', str(text or ''))
    try:
        val = float(cleaned)
    except (ValueError, TypeError):
        return None
    return val if 0 < val < 1_000_000 else None


def is_credit_amount(text):
    """True for credit/payment rows shown with a leading or trailing minus."""
    t = text.strip()
    return t.startswith('-') or t.endswith('-')


def make_expense(date, vendor, amount):
    return {
        'transaction_date':  date,
        'vendor_name':       vendor,
        'expense_amount':    f'{amount:.2f}',
        'buyer_name':        '',
        'transaction_desc':  vendor,
        'transaction_notes': '',
        'project_id':        None,
        'cost_centre_id':    None,
        'account_number_id': None,
    }


def deduplicate(expenses):
    seen, result = set(), []
    for exp in expenses:
        key = (exp['transaction_date'], exp['vendor_name'], exp['expense_amount'])
        if key not in seen:
            seen.add(key)
            result.append(exp)
    return result


def _normalize_vendor_key(vendor):
    """Strip whitespace/punctuation and lowercase so 'WAL-MART STORE#3134'
    and 'walmartstore3134' compare equal."""
    return re.sub(r'[^a-z0-9]', '', (vendor or '').lower())


def pair_refunds(expenses, refunds, window_days=60):
    """Cancel matching purchase/refund pairs.

    Returns (remaining_expenses, unmatched_refunds, paired_count).

    A refund is paired with the first positive transaction that has:
      - the same normalised vendor
      - the same absolute amount (within $0.01)
      - a transaction_date within `window_days` either side

    Each positive can be paired at most once, so two identical purchases
    can be cancelled by two identical refunds.
    """
    paired_indices = set()
    unmatched = []
    pairs = 0

    for refund in refunds:
        r_vendor = _normalize_vendor_key(refund.get('vendor_name'))
        try:
            r_amount = abs(float(refund.get('expense_amount', 0)))
            r_date = datetime.strptime(refund['transaction_date'], '%Y-%m-%d')
        except (ValueError, TypeError, KeyError):
            unmatched.append(refund)
            continue

        matched_idx = None
        for i, pos in enumerate(expenses):
            if i in paired_indices:
                continue
            if _normalize_vendor_key(pos.get('vendor_name')) != r_vendor:
                continue
            try:
                p_amount = float(pos.get('expense_amount', 0))
            except (ValueError, TypeError):
                continue
            if abs(p_amount - r_amount) > 0.01:
                continue
            try:
                p_date = datetime.strptime(pos['transaction_date'], '%Y-%m-%d')
            except (ValueError, KeyError):
                continue
            if abs((r_date - p_date).days) > window_days:
                continue
            matched_idx = i
            break

        if matched_idx is not None:
            paired_indices.add(matched_idx)
            pairs += 1
        else:
            unmatched.append(refund)

    remaining = [p for i, p in enumerate(expenses) if i not in paired_indices]
    return remaining, unmatched, pairs


def group_words_by_line(words, y_bucket=4):
    """Bucket pdfplumber words by vertical position; sort within each bucket."""
    lines = defaultdict(list)
    for w in words:
        lines[round(w['top'] / y_bucket) * y_bucket].append(w)
    return {y: sorted(ws, key=lambda w: w['x0']) for y, ws in lines.items()}


def clean_vendor(text):
    """Collapse whitespace, strip stray punctuation; '' if shorter than 2 chars."""
    text = re.sub(r'\s{2,}', ' ', text).strip(' -_.,;:/\\$')
    return text if len(text) >= 2 else ''


# ----- Strategy: RBC credit card -----
#
# Header is split across 3 visual lines:
#     TRANSACTION   POSTING
#     ACTIVITY DESCRIPTION                       AMOUNT ($)
#     DATE          DATE
#
# Cuts (not nearest-centre) are required because ACTIVITY DESCRIPTION is
# centred mid-column while description text is left-aligned at POSTING.x1 + ~5.

def _build_rbc_column_cuts(window_words):
    """Compute x-cut points between RBC's 4 columns from a header window."""
    anchors = {}
    for w in window_words:
        text = w['text'].strip().upper()
        if text in ('TRANSACTION', 'POSTING', 'ACTIVITY', 'DESCRIPTION', 'AMOUNT'):
            anchors.setdefault(text, (w['x0'], w['x1']))

    if not {'TRANSACTION', 'POSTING', 'AMOUNT'}.issubset(anchors):
        return None
    desc = anchors.get('DESCRIPTION') or anchors.get('ACTIVITY')
    if desc is None:
        return None

    txn, post, amt = anchors['TRANSACTION'], anchors['POSTING'], anchors['AMOUNT']
    return {
        'cut_12': (txn[1] + post[0]) / 2,
        'cut_23': post[1] + 5,
        'cut_34': (desc[1] + amt[0]) / 2,
    }


def _bucket_rbc_word(x_mid, cuts):
    if x_mid < cuts['cut_12']:
        return 'txn_date'
    if x_mid < cuts['cut_23']:
        return 'post_date'
    if x_mid < cuts['cut_34']:
        return 'desc'
    return 'amount'


def strategy_rbc_credit_card(pdf, statement_year=None):
    """Parse RBC credit-card PDFs; positive amounts only, payments skipped."""
    expenses = []

    for page_num, page in enumerate(pdf.pages):
        words = page.extract_words(x_tolerance=3, y_tolerance=3)
        dbg(f'[RBC] Page {page_num + 1}: {len(words)} words')
        if not words:
            continue

        lines = group_words_by_line(words)
        sorted_y = sorted(lines.keys())
        cuts = None
        current_date = None
        i = 0

        while i < len(sorted_y):
            row_words = lines[sorted_y[i]]
            line_text = ' '.join(w['text'] for w in row_words)

            # Header detection: when we see "TRANSACTION", grow a window
            # until all required anchors are present, then skip past it.
            if cuts is None:
                if not any(w['text'].strip().upper() == 'TRANSACTION' for w in row_words):
                    i += 1
                    continue
                for span in range(1, 5):
                    end = min(i + span, len(sorted_y))
                    window = [w for j in range(i, end) for w in lines[sorted_y[j]]]
                    cuts = _build_rbc_column_cuts(window)
                    if cuts:
                        i = end
                        current_date = None
                        dbg(f'[RBC]   Cuts: {cuts}')
                        break
                else:
                    i += 1
                continue

            i += 1
            if SKIP_RE.search(line_text):
                continue

            buckets = defaultdict(list)
            for w in row_words:
                x_mid = (w['x0'] + w['x1']) / 2
                buckets[_bucket_rbc_word(x_mid, cuts)].append(w['text'])

            txn_date_text = ' '.join(buckets.get('txn_date', []))
            desc_text     = ' '.join(buckets.get('desc',     []))
            amount_text   = ' '.join(buckets.get('amount',   []))

            if txn_date_text:
                m = DATE_RE.search(txn_date_text)
                if m:
                    parsed = normalize_date(m.group(1), statement_year)
                    if parsed:
                        current_date = parsed

            if not current_date or is_credit_amount(amount_text):
                continue

            money = MONEY_STRICT_RE.search(amount_text)
            amount = parse_amount(money.group(1)) if money else None
            vendor = clean_vendor(desc_text)
            if not amount or not vendor:
                continue

            dbg(f'[RBC]   → {current_date} | {vendor} | {amount}')
            expenses.append(make_expense(current_date, vendor, amount))

    return expenses


# ----- Strategy: TD credit card -----
#
# TD Business Travel Visa statements use a 4-column transaction table
# (TRANSACTION DATE / POSTING DATE / ACTIVITY DESCRIPTION / AMOUNT($))
# with a wide info side panel on the right and chatty continuation rows
# below long transactions (city wraps such as "STITTSVILLE", and
# "FOREIGN CURRENCY ... USD" / "@ EXCHANGE RATE" annotations).
#
# x-position bucketing under-counts because:
#   - y-clustering collapses two close lines into one
#   - continuation rows reuse the prior date, producing spurious entries
#
# This parser works against the page's text dump line-by-line instead:
#   1. Skip everything until the table header row appears.
#   2. Match the canonical transaction shape with a regex:
#        MONTH DAY  MONTH DAY  DESCRIPTION  ±$AMOUNT
#   3. Treat short, money-free trailing lines as vendor continuations
#      (e.g. "STITTSVILLE", "ANTHROPIC.CO") and append to the previous row.
#   4. Drop refunds / payments (leading '-' on the amount) so the claim
#      only sees real purchases.

# pdfplumber on this PDF emits adjacent words run together (e.g. "TDBUSINESS",
# "ACTIVITYDESCRIPTION", "PAYMENTDUEDATE"), so every word-boundary in our
# regexes uses \s* (zero or more) rather than \s+.

TD_DETECT_RE = re.compile(
    r'TD\s*(BUSINESS|VISA|CARDHOLDER|CANADA\s*TRUST)',
    re.IGNORECASE,
)

# Match: month-abbrev day  /  month-abbrev day  /  description  /  ±$amount
# - Anchor: amount must be followed by whitespace or end-of-line (lookahead),
#   so side-panel garbage that the PDF appends after the amount on the same
#   visual line ("$184.73 Promotions&Adjustments - 7,973") doesn't block the
#   match.
# - Description is non-greedy so it stops at the first valid $amount.
TD_TXN_RE = re.compile(
    r'(?P<txn_month>JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s*(?P<txn_day>\d{1,2})\s+'
    r'(?P<post_month>JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s*(?P<post_day>\d{1,2})\s+'
    r'(?P<desc>.+?)\s+'
    r'(?P<sign>-)?\$(?P<amount>\d{1,3}(?:,\d{3})*\.\d{2})(?=\s|$)',
    re.IGNORECASE,
)

TD_HEADER_RE = re.compile(r'ACTIVITY\s*DESCRIPTION.*AMOUNT', re.IGNORECASE)

# Lines that should be ignored entirely (totals, right-side info panel,
# foreign-currency annotation rows, payment-slip footer). The \s* lets us
# match both "FOREIGN CURRENCY" and the run-together "FOREIGNCURRENCY".
TD_SKIP_RE = re.compile(
    r'(foreign\s*currency|exchange\s*rate|previous\s*statement\s*balance'
    r'|total\s*new\s*balance|new\s*balance|continued|payment\s*information'
    r'|payment\s*due\s*date|td\s*rewards\s*points|previous\s*td\s*rewards'
    r'|earned\s*this\s*statement|promotions\s*&\s*adjustments'
    r'|total\s*td\s*rewards|calculating\s*your\s*balance|contact\s*information'
    r'|customer\s*service|tty\s*inquiries|to\s*book\s*travel|special\s*offers'
    r'|preauthorized\s*payment|minimum\s*payment|credit\s*limit'
    r'|available\s*credit|annual\s*interest\s*rate|purchases\s*&\s*other'
    r'|previous\s*balance|payments\s*&\s*credits|sub-?total'
    r'|cash\s*advances|td\s*canada\s*trust|account\s*number|td\s*message'
    r'|td\s*business\s*travel\s*visa|important\s*changes)',
    re.IGNORECASE,
)


def _td_is_continuation(line):
    """Short, money-free, digit-light text that should be appended to the
    most recent transaction's vendor (e.g. 'STITTSVILLE', 'ANTHROPIC.CO',
    'MID-'). Anything containing a $ amount or a 2+ digit run is rejected
    so foreign-currency notes and side-panel snippets don't get merged."""
    if not line or len(line) > 40:
        return False
    if '$' in line or '%' in line:
        return False
    if re.search(r'\d{2,}', line):
        return False
    if TD_TXN_RE.search(line):
        return False
    if TD_SKIP_RE.search(line):
        return False
    return True


def _td_parse_line(line, statement_year):
    """Try to extract a transaction from a single text line.

    Returns one of:
      ('expense', dict)  — positive purchase
      ('refund',  dict)  — negative posting (expense_amount stored as -X.XX)
      ('skip',    None)  — matched the txn shape but should be ignored
                           (e.g. PREAUTHORIZED PAYMENT = bill payment)
      (None,      None)  — line is not a transaction
    """
    m = TD_TXN_RE.search(line)
    if not m:
        return None, None

    date_str = f"{m.group('txn_month').capitalize()} {m.group('txn_day')}"
    date = normalize_date(date_str, statement_year)
    amount = parse_amount(m.group('amount'))
    vendor = clean_vendor(m.group('desc'))
    if not date or not amount or not vendor:
        return 'skip', None

    if m.group('sign') == '-':
        # Bill payments share the negative-amount shape but are not refunds —
        # they're the cardholder paying off the balance and must never appear
        # in the claim or in the refund report.
        if TD_SKIP_RE.search(line):
            return 'skip', None
        refund = make_expense(date, vendor, amount)
        refund['expense_amount'] = f'-{amount:.2f}'
        return 'refund', refund

    return 'expense', make_expense(date, vendor, amount)


def strategy_td_credit_card(pdf, statement_year=None):
    """TD Business Visa parser. Returns a dict with 'expenses' and 'refunds'
    so the main loop can auto-pair refunds against their matching purchases."""
    # extract_text() is used only for the TD-brand detection check because it
    # handles run-together header tokens (e.g. "TDBUSINESS") via \s* in the regex.
    first_page_text = pdf.pages[0].extract_text() if pdf.pages else ''
    if not TD_DETECT_RE.search(first_page_text or ''):
        return {'expenses': [], 'refunds': []}

    expenses = []
    refunds = []
    seen_header = False
    last_appended = None  # ref to the most recently appended dict (for vendor continuation)

    for page_num, page in enumerate(pdf.pages):
        # x_tolerance=1 makes pdfplumber insert a space between any two character
        # clusters separated by more than 1pt — word gaps are always wider, so
        # "SPB2BDISCOUNTERSVANCOUVER" becomes "SP B2B DISCOUNTERS VANCOUVER".
        # We keep extract_text() (not extract_words) so each PDF line stays intact
        # and the right-side info panel does not merge with transaction lines.
        text = page.extract_text(x_tolerance=1, y_tolerance=3) or ''
        dbg(f'[TD] Page {page_num + 1}: {len(text)} chars')

        for raw_line in text.split('\n'):
            line = raw_line.strip()
            if not line:
                continue

            # Wait for the table header on the first transaction page,
            # then stay in extraction mode for the rest of the document.
            if not seen_header:
                if TD_HEADER_RE.search(line):
                    seen_header = True
                    dbg(f'[TD]   Header detected: {line!r}')
                continue

            # The same header reappears on continuation pages; skip it.
            if TD_HEADER_RE.search(line):
                last_appended = None
                continue

            # Try to extract a transaction BEFORE consulting the skip list,
            # because pdfplumber sometimes appends side-panel content onto
            # the same line as a legitimate transaction.
            kind, row = _td_parse_line(line, statement_year)
            if kind == 'expense':
                dbg(f'[TD]   + {row["transaction_date"]} | {row["vendor_name"]} | {row["expense_amount"]}')
                expenses.append(row)
                last_appended = row
                continue
            if kind == 'refund':
                dbg(f'[TD]   - {row["transaction_date"]} | {row["vendor_name"]} | {row["expense_amount"]} (refund)')
                refunds.append(row)
                last_appended = row
                continue
            if kind == 'skip':
                # Line was txn-shaped but is a bill payment or unparseable.
                last_appended = None
                continue

            if TD_SKIP_RE.search(line):
                last_appended = None
                continue

            # Continuation row: append city / suffix to the prior vendor
            # (works for both positive and negative rows).
            if last_appended is not None and _td_is_continuation(line):
                merged = clean_vendor(f"{last_appended['vendor_name']} {line}")
                last_appended['vendor_name'] = merged
                last_appended['transaction_desc'] = merged
                last_appended = None  # only merge one continuation per row
                continue

            last_appended = None

    return {'expenses': expenses, 'refunds': refunds}


# ----- Strategy: column-aware (x-position bucketing) -----

def _detect_column_header(row_words):
    """Return {col_name: x_centre} if this row is the table header, else None."""
    found = {}
    for w in row_words:
        txt = w['text'].strip()
        for col_name, pattern in COLUMN_KEYWORDS.items():
            if pattern.match(txt) and col_name not in found:
                found[col_name] = (w['x0'] + w['x1']) / 2
                break
    if 'date' in found and 'description' in found and ('withdrawal' in found or 'deposit' in found):
        return found
    return None


def strategy_column_aware(pdf, statement_year=None):
    """Generic column-aware parser using nearest-x-centre bucketing."""
    expenses = []

    for page_num, page in enumerate(pdf.pages):
        words = page.extract_words(x_tolerance=3, y_tolerance=3)
        dbg(f'[S1] Page {page_num + 1}: {len(words)} words')
        if not words:
            continue

        lines = group_words_by_line(words)
        col_positions = None
        current_date = None

        for y in sorted(lines.keys()):
            row_words = lines[y]
            line_text = ' '.join(w['text'] for w in row_words)

            detected = _detect_column_header(row_words)
            if detected:
                col_positions = detected
                current_date = None
                dbg(f'[S1]   Header at y={y}: {col_positions}')
                continue

            if col_positions is None or SKIP_RE.search(line_text):
                continue

            buckets = defaultdict(list)
            for w in row_words:
                x_mid = (w['x0'] + w['x1']) / 2
                nearest = min(col_positions, key=lambda c: abs(col_positions[c] - x_mid))
                buckets[nearest].append(w['text'])

            date_text  = ' '.join(buckets.get('date',        []))
            desc_text  = ' '.join(buckets.get('description', []))
            debit_text = ' '.join(buckets.get('withdrawal',  []))

            if date_text:
                m = DATE_RE.search(date_text)
                if m:
                    parsed = normalize_date(m.group(1), statement_year)
                    if parsed:
                        current_date = parsed

            if not current_date or is_credit_amount(debit_text):
                continue

            amount = parse_amount(debit_text)
            vendor = clean_vendor(desc_text)
            if not amount or not vendor:
                continue

            dbg(f'[S1]   → {current_date} | {vendor} | {amount}')
            expenses.append(make_expense(current_date, vendor, amount))

    return expenses


# ----- Strategy: pdfplumber table-borders -----

def _row_amount(cells, col_map):
    """Extract debit amount from a table row using col_map; None to skip row."""
    if 'withdrawal' in col_map:
        raw = cells[col_map['withdrawal']]
        if is_credit_amount(raw):
            return None
        return parse_amount(raw)
    # No header detected — collect numeric cells; last is balance, second-to-last is debit.
    deposit_idx = col_map.get('deposit')
    numeric = [parse_amount(c) for i, c in enumerate(cells)
               if parse_amount(c) and i != deposit_idx]
    if len(numeric) >= 2:
        return numeric[-2]
    return numeric[0] if numeric else None


def strategy_table_borders(pdf, statement_year=None):
    """Use pdfplumber's table detector when borders are drawn in the PDF."""
    expenses = []

    for page_num, page in enumerate(pdf.pages):
        tables = page.extract_tables()
        dbg(f'[S2] Page {page_num + 1}: {len(tables)} table(s)')

        for table in tables:
            col_map = {}
            data_rows = []

            for row in table or []:
                if not row:
                    continue
                cells = [str(c).strip() if c else '' for c in row]
                if not col_map:
                    for i, cell in enumerate(cells):
                        for col_name, pattern in COLUMN_KEYWORDS.items():
                            if pattern.match(cell) and col_name not in col_map:
                                col_map[col_name] = i
                    if 'date' in col_map and 'description' in col_map:
                        dbg(f'[S2]   col_map: {col_map}')
                        continue
                data_rows.append(cells)

            current_date = None
            for cells in data_rows:
                if SKIP_RE.search(' '.join(cells)):
                    continue

                date_cell = (cells[col_map['date']] if 'date' in col_map and col_map['date'] < len(cells)
                             else next((c for c in cells if DATE_RE.search(c)), ''))
                m = DATE_RE.search(date_cell) if date_cell else None
                if m:
                    parsed = normalize_date(m.group(1), statement_year)
                    if parsed:
                        current_date = parsed
                if not current_date:
                    continue

                vendor = (cells[col_map['description']] if 'description' in col_map and col_map['description'] < len(cells)
                          else max((c for c in cells if c and not DATE_RE.search(c) and not parse_amount(c)),
                                   key=len, default=''))
                vendor = clean_vendor(vendor)
                if not vendor:
                    continue

                amount = _row_amount(cells, col_map)
                if not amount:
                    continue

                dbg(f'[S2]   → {current_date} | {vendor} | {amount}')
                expenses.append(make_expense(current_date, vendor, amount))

    return expenses


# ----- Strategy: line-by-line regex (last resort) -----

def _select_line_amount(line_text):
    """
    Pick the transaction amount from a line. Returns (val, raw) or (None, '').

    DR-suffixed amount → use immediately. CR-suffixed → skip (deposit).
    Unlabeled → take second-to-last (last is the running balance).
    """
    unlabeled = []
    for m in AMOUNT_RE.finditer(line_text):
        val = parse_amount(m.group(1))
        if not val or (1900 < val < 2200 and '.' not in m.group(1)):
            continue  # year-like, e.g. "2024"
        label = (m.group(2) or '').upper()
        if label == 'DR':
            return val, m.group(0)
        if label == 'CR':
            continue
        unlabeled.append((val, m.group(0)))
    if len(unlabeled) >= 2:
        return unlabeled[-2]
    if unlabeled:
        return unlabeled[0]
    return None, ''


def strategy_line_by_line(pdf, statement_year=None):
    """Last-resort regex parser when neither headers nor borders are detectable."""
    expenses = []

    for page_num, page in enumerate(pdf.pages):
        words = page.extract_words(x_tolerance=3, y_tolerance=3)
        dbg(f'[S3] Page {page_num + 1}: {len(words)} words')
        if not words:
            continue

        lines = group_words_by_line(words)
        current_date = None

        for y in sorted(lines.keys()):
            row_words = lines[y]
            line_text = re.sub(r'\s{2,}', ' ', ' '.join(w['text'] for w in row_words)).strip()

            if len(line_text) < 4 or SKIP_RE.search(line_text) or HEADER_ROW_RE.match(line_text):
                continue

            date_m = DATE_RE.search(line_text)
            if date_m:
                parsed = normalize_date(date_m.group(1), statement_year)
                if parsed:
                    current_date = parsed
            if not current_date:
                continue

            amount, amount_raw = _select_line_amount(line_text)
            if not amount:
                continue

            vendor = line_text
            if date_m:
                vendor = vendor.replace(date_m.group(0), ' ')
            vendor = vendor.replace(amount_raw, ' ')
            # Strip the running balance (any remaining comma-grouped number).
            vendor = re.sub(r'\b\d{1,3}(?:,\d{3})+(?:\.\d{2})?\b', ' ', vendor)
            vendor = re.sub(r'[|*#]+', ' ', vendor)
            vendor = clean_vendor(vendor)
            if not vendor or re.fullmatch(r'[\d,. ]+', vendor):
                continue

            dbg(f'[S3]   → {current_date} | {vendor} | {amount}')
            expenses.append(make_expense(current_date, vendor, amount))

    return expenses


# ----- main -----

# Strategies are tried in order; the first one that yields rows wins.
# TD is checked first because it self-gates on TD-specific signatures and
# applies tighter filtering than the generic RBC variant.
STRATEGIES = (
    strategy_td_credit_card,
    strategy_rbc_credit_card,
    strategy_column_aware,
    strategy_table_borders,
    strategy_line_by_line,
)


def _normalize_strategy_result(result):
    """Accept either a list (legacy strategies) or a dict with
    'expenses'/'refunds' keys (new shape). Always return the dict shape."""
    if isinstance(result, dict):
        return {
            'expenses': result.get('expenses') or [],
            'refunds':  result.get('refunds')  or [],
        }
    return {'expenses': list(result or []), 'refunds': []}


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: extract_bank_statement.py <pdf> [--debug]"}))
        sys.exit(1)

    pdf_path = sys.argv[1]
    try:
        with pdfplumber.open(pdf_path) as pdf:
            dbg(f'Opened PDF: {len(pdf.pages)} page(s)')

            first_text = pdf.pages[0].extract_text() if pdf.pages else ''
            statement_year = extract_statement_year(first_text)
            dbg(f'Statement year: {statement_year}')

            expenses = []
            refunds = []
            for strategy in STRATEGIES:
                result = _normalize_strategy_result(strategy(pdf, statement_year))
                dbg(f'{strategy.__name__}: {len(result["expenses"])} expenses, {len(result["refunds"])} refunds')
                if result['expenses'] or result['refunds']:
                    expenses = result['expenses']
                    refunds = result['refunds']
                    break

            expenses = deduplicate(expenses)
            refunds = deduplicate(refunds)
            expenses, refunds, paired = pair_refunds(expenses, refunds)

            dbg(f'After pairing: {len(expenses)} expenses, {len(refunds)} unmatched refunds, {paired} pairs cancelled')

            print(json.dumps({
                "expenses":  expenses,
                "refunds":   refunds,
                "count":     len(expenses),
                "paired":    paired,
            }))

    except Exception as exc:
        print(json.dumps({"error": str(exc)}))
        sys.exit(1)


if __name__ == '__main__':
    main()
