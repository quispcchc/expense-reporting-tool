# Expense and Revenue Reporting Tool – Frontend

## Integration with Backend

This frontend currently integrates with the following backend authentication APIs:

### Auth Endpoints

- **POST /login**
- **POST /logout**
- **POST /forget-password**

  _Notes_: After submitting the email, users are supposed to receive an email with a reset password link containing a token that navigates them to the reset password page. Due to no real mail host being set up, for demo purposes users must manually click the link to navigate to the reset password page.

- **POST /reset-password**
- **PUT /update-password**

### Other API Endpoints

All other endpoints are still under development. For demonstration purposes, the frontend uses mock data for features beyond authentication.

---

## Static Frontend Pages (UI Done, Backend Integration Pending)

### Claim Management

#### Claims Dashboard

**Finished:**

- Implemented claim list UI
- Implemented filter and search functionality

**To Do:**

- Approve / reject selected items
- Export selected claims to CSV

#### Create Claim

**Finished:**

- Base form done
- Add / edit / delete expenses functionality

**To Do:**

- Mileage form

#### Edit Claim

**Finished:**

- Add notes
- View, edit, delete expenses

**To Do:**

- Approve / reject expenses

#### View Claim

- Full layout ready

---

### User & Department Management

- **User Page:** UI completed
- **Teams Page:** UI completed
- **Cost Centre Page:** UI completed
- **Settings Page:** UI completed
- **Tag Page:** Incomplete

---

## Notes

- Authentication is fully functional.
- Claim-related and management pages are ready for future API integration.
