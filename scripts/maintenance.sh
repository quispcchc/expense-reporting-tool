#!/bin/bash
# maintenance.sh - Database and Log Maintenance Script
# Run daily via cron: 0 3 * * * /var/www/expense-app/scripts/maintenance.sh >> /var/log/expense-maintenance.log 2>&1

set -e

# Configuration
APP_DIR="${APP_DIR:-/var/www/expense-app}"
BACKEND_DIR="$APP_DIR/backend"
LOG_DIR="$BACKEND_DIR/storage/logs"
DB_FILE="$BACKEND_DIR/database/database.sqlite"
ARCHIVE_DIR="${ARCHIVE_DIR:-/backup/expense-app}"
ARCHIVE_DAYS="${ARCHIVE_DAYS:-90}"  # Archive logs older than this

# Colors (for interactive use)
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INFO] $1"; }
log_warn() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [WARN] $1"; }
log_error() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR] $1"; }

# ============================================
# SQLite Database Maintenance
# ============================================
db_maintenance() {
    log_info "Starting database maintenance..."
    
    if [ ! -f "$DB_FILE" ]; then
        log_error "Database file not found: $DB_FILE"
        return 1
    fi
    
    # Get current size
    BEFORE_SIZE=$(stat --format=%s "$DB_FILE" 2>/dev/null || stat -f%z "$DB_FILE")
    log_info "Database size before: $(numfmt --to=iec $BEFORE_SIZE)"
    
    # Clean old sessions (older than 7 days)
    log_info "Cleaning old sessions..."
    sqlite3 "$DB_FILE" "DELETE FROM sessions WHERE last_activity < strftime('%s', 'now', '-7 days');" 2>/dev/null || true
    
    # Clean old tokens (unused for 30 days)
    log_info "Cleaning old access tokens..."
    sqlite3 "$DB_FILE" "DELETE FROM personal_access_tokens WHERE last_used_at IS NULL OR last_used_at < datetime('now', '-30 days');" 2>/dev/null || true
    
    # Clean completed queue jobs (older than 7 days)
    log_info "Cleaning old job batches..."
    sqlite3 "$DB_FILE" "DELETE FROM job_batches WHERE finished_at IS NOT NULL AND finished_at < strftime('%s', 'now', '-7 days') * 1000;" 2>/dev/null || true
    
    # Clean failed jobs (older than 30 days)
    log_info "Cleaning old failed jobs..."
    sqlite3 "$DB_FILE" "DELETE FROM failed_jobs WHERE failed_at < datetime('now', '-30 days');" 2>/dev/null || true
    
    # WAL checkpoint to merge WAL into main database
    log_info "Running WAL checkpoint..."
    sqlite3 "$DB_FILE" "PRAGMA wal_checkpoint(TRUNCATE);" 2>/dev/null || true
    
    # VACUUM to reclaim disk space
    log_info "Running VACUUM..."
    sqlite3 "$DB_FILE" "VACUUM;"
    
    # Analyze for query optimization
    log_info "Running ANALYZE..."
    sqlite3 "$DB_FILE" "ANALYZE;"
    
    # Get new size
    AFTER_SIZE=$(stat --format=%s "$DB_FILE" 2>/dev/null || stat -f%z "$DB_FILE")
    SAVED=$((BEFORE_SIZE - AFTER_SIZE))
    
    log_info "Database size after: $(numfmt --to=iec $AFTER_SIZE)"
    if [ $SAVED -gt 0 ]; then
        log_info "Space reclaimed: $(numfmt --to=iec $SAVED)"
    fi
}

# ============================================
# Log Archive
# ============================================
log_archive() {
    log_info "Starting log archive..."
    
    # Create archive directory
    mkdir -p "$ARCHIVE_DIR/logs"
    
    # Archive old compressed logs
    if [ -d "$LOG_DIR" ]; then
        find "$LOG_DIR" -name "*.log" -mtime +$ARCHIVE_DAYS -exec gzip {} \; 2>/dev/null || true
        find "$LOG_DIR" -name "*.gz" -mtime +$ARCHIVE_DAYS -exec mv {} "$ARCHIVE_DIR/logs/" \; 2>/dev/null || true
        log_info "Archived logs older than $ARCHIVE_DAYS days"
    fi
    
    # Clean very old archives (older than 1 year)
    find "$ARCHIVE_DIR/logs" -name "*.gz" -mtime +365 -delete 2>/dev/null || true
    log_info "Removed archives older than 1 year"
}

# ============================================
# Cache Cleanup
# ============================================
cache_cleanup() {
    log_info "Starting cache cleanup..."
    
    cd "$BACKEND_DIR"
    
    # Clear expired cache (Laravel)
    php artisan cache:clear 2>/dev/null || true
    
    # Clear old views
    php artisan view:clear 2>/dev/null || true
    
    log_info "Cache cleanup complete"
}

# ============================================
# Disk Usage Report
# ============================================
disk_report() {
    log_info "=== Disk Usage Report ==="
    
    echo "Overall disk usage:"
    df -h / | tail -1
    
    echo ""
    echo "Application directories:"
    du -sh "$APP_DIR" 2>/dev/null || echo "App dir not found"
    du -sh "$LOG_DIR" 2>/dev/null || echo "Log dir not found"
    du -sh "$BACKEND_DIR/storage" 2>/dev/null || echo "Storage dir not found"
    
    echo ""
    echo "Database size: $(stat --format=%s "$DB_FILE" 2>/dev/null | numfmt --to=iec || echo 'N/A')"
}

# ============================================
# Main
# ============================================
main() {
    log_info "=========================================="
    log_info "Starting maintenance tasks"
    log_info "=========================================="
    
    db_maintenance
    log_archive
    cache_cleanup
    disk_report
    
    log_info "=========================================="
    log_info "Maintenance complete"
    log_info "=========================================="
}

# Run based on arguments
case "${1:-all}" in
    db)
        db_maintenance
        ;;
    logs)
        log_archive
        ;;
    cache)
        cache_cleanup
        ;;
    report)
        disk_report
        ;;
    all|*)
        main
        ;;
esac
