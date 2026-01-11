# Replace Hardcoded Values with APIs

Created time: September 9, 2025 9:46 AM
Last edited time: November 13, 2025 3:47 PM
progress: In progress
Project: Expense/Revenue Reporting Application (https://www.notion.so/Expense-Revenue-Reporting-Application-1a093d2b78af801b9fe1ced01aa61c0f?pvs=21)
Responsible: Sandrima, Shan

# To-do list

- [ ]  Identify places in the code where values are hardcoded (e.g., user data, Teams, Cost center) and list every functionality here.
- [ ]  

# frontend

# api.js

- [ ]  The base URL is hardcoded as **“[http://127.0.0.1:8000/api”](http://127.0.0.1:8000/api%E2%80%9D)**
- [ ]  The timeout value is hardcoded as **10,000 milliseconds (10 seconds)**.
- [ ]  The content type is hardcoded as **“application/json”**
- [ ]  The error message **“Email or Password is not correct. Please Try Again!”** is hardcoded.
- [ ]  The error message **“Access Denied”** is hardcoded.
- [ ]  The fallback error message **“Request Failed”** is hardcoded.

# **ContentHeader.jsx**

- [ ]  The word **“Home”** is hardcoded as the link text.
- [ ]  The CSS class names such as **“text-gray-500”**, **“pi pi-home mr-1”**, and **“text-2xl”** are hardcoded style values.
- [ ]  The breadcrumb **separator icon (`FaCaretRight`)** is hardcoded.

# **Header.jsx**

- [ ]  The **login path “/login”** is hardcoded in the navigation after logout.
- [ ]  The **background color “#F6F6F6”** for the notification box is hardcoded.
- [ ]  The **notification count “8”** is hardcoded.
- [ ]  The **red color “bg-red-600”** and **white text color “text-white”** for the notification badge are hardcoded.
- [ ]  The **menu link path “/update-password”** is hardcoded.
- [ ]  The **menu item labels “Reset Password”** and **“Log out”** are hardcoded text.
- [ ]  The **CSS class names** such as `"h-20"`, `"flex"`, `"bg-white"`, `"hover:bg-blue-100"`, and `"border-gray-100"` are hardcoded style values.

# **SideBar.jsx**

- [ ]  The **sidebar section titles** “CLAIMS” and “GENERAL” are hardcoded.
- [ ]  The **menu item labels** such as “All Claims,” “New Claim,” “Users,” “Teams,” “Cost Centre,” “Tags,” and “Settings” are hardcoded.
- [ ]  The **menu item paths** like “/admin/claims,” “/admin/claims/create-claim,” “/admin/users,” “/admin/teams,” “/admin/cost-centre,” “/admin/tags,” and “/admin/settings” are hardcoded.
- [ ]  The **application name “My App”** is hardcoded in the sidebar header.
- [ ]  The **color codes** such as “#184190,” “#888888,” “#D9EDFF,” and “#1D1B20” are hardcoded.
- [ ]  The **CSS class names** like “bg-white,” “hover:bg-gray-100,” and “text-gray-700” are hardcoded style values.
- [ ]  The **media breakpoint width (768px)** used for detecting mobile view is hardcoded.

# **AmountRangeFilter.jsx**

- [ ]  The **placeholder texts** “from” and “to” are hardcoded.
- [ ]  The **CSS class names** such as “flex,” “gap-1,” “p-inputtext,” “p-component,” “min-w-20,” and “w-100” are hardcoded style values.
- [ ]  The **input type “text”** is hardcoded.

# **ComponentContainer.jsx**

- [ ]  The **CSS class names** such as “bg-white,” “h-full,” “p-6,” “rounded-2xl,” “shadow-sm,” “text-[22px],” and “mb-2” are hardcoded style values.
- [ ]  The **heading level `<h5>`** is hardcoded as the fixed title element.

# **DateRangeFilter.jsx**

- [ ]  The **input type “date”** is hardcoded for both input fields.
- [ ]  The **placeholder text “Start date”** is hardcoded.
- [ ]  The **CSS class names** such as “flex,” “gap-1,” “p-inputtext,” and “p-component” are hardcoded style values.

# **Input.jsx**

- [ ]  The **CSS class names** such as “block,” “text-sm,” “font-medium,” “mb-2,” “w-full,” “text-red-500,” and “mt-2” are hardcoded style values
- [ ]  The **text color “text-red-500”** for error messages is hardcoded.

# **InputPassword.jsx**

- [ ]  The **CSS class names** such as “mb-3,” “block,” “text-sm,” “font-medium,” “mb-2,” “w-full,” “text-red-500,” and “mt-2” are hardcoded style values.
- [ ]  The **icon classes** “pi-eye” and “pi-eye-slash” used for showing and hiding passwords are hardcoded.
- [ ]  The **input types “text” and “password”** are hardcoded.

# **Loader.jsx**

- [ ]  The **CSS class names** such as “fixed,” “inset-0,” “z-50,” “bg-black/20,” “flex,” “items-center,” and “justify-center” are hardcoded style values.
- [ ]  The **background overlay color “bg-black/20”** (a translucent black shade) is hardcoded.

# **MyTable.jsx**

- [ ]  The CSS class names such as “overflow-x-auto,” “rounded-2xl,” “border,” “border-gray-100,” “border-collapse,” “w-full,” “text-left,” “border-b,” “border-gray-300,” and “p-3” are hardcoded style values.
- [ ]  The background color “bg-[#f8f8f8]” for the table header is hardcoded.

# **Select.jsx**

- [ ]  The CSS class names such as “block,” “text-sm,” “font-medium,” “mb-2,” “w-full,” “text-red-500,” and “mt-2” are hardcoded style values.
- [ ]  The placeholder text “Select an option” is hardcoded.
- [ ]  The text color “text-red-500” for error messages is hardcoded.

# **SelectAllCheckbox.jsx**

- [ ]  The input type “checkbox” is hardcoded.

# **StatusTab.jsx**

- [ ]  The fallback style value “bg-[#FFF5C5] text-[#E27D00]” is hardcoded.
- [ ]  The CSS class names such as “rounded-lg,” “p-1,” “text-center,” “text-sm,” “font-medium,” and “w-21” are hardcoded style values.

# **LoginForm.jsx**

- [ ]  The CSS class names such as “w-100,” “p-5,” “text-2xl,” “font-bold,” “mb-6,” “text-xl,” “font-semibold,” “text-sm,” “text-gray-500,” “mb-6,” “flex,” “items-center,” “justify-between,” “mr-2,” “bg-red-100,” “text-red-600,” “rounded-xl,” “p-2,” and “w-full” are hardcoded style values.
- [ ]  The color code “#05589B” for the title text is hardcoded.
- [ ]  The application name “My APP” is hardcoded.
- [ ]  The heading “Login to Your Account” is hardcoded.
- [ ]  The helper text “Enter your email address to get started.” is hardcoded.
- [ ]  The input placeholder “Please enter your email” is hardcoded.
- [ ]  The input placeholder “Please enter your password” is hardcoded.
- [ ]  The label text “Remember me?” is hardcoded.
- [ ]  The link text “Forgot Password?” and its path “/forgot-password” are hardcoded.
- [ ]  The button label “Submit” is hardcoded.

# **ProtectedRoute.jsx**

- [ ]  The login redirect path “/login” is hardcoded.
- [ ]  The use of “window.history.back()” for navigating back is hardcoded behavior.

# **AddNote.jsx**

- [ ]  The paragraph text “Add a Note” is hardcoded.
- [ ]  The placeholder text “Enter a text...” in the textarea is hardcoded.
- [ ]  The button label “Submit Note” is hardcoded.
- [ ]  The CSS class names such as “mt-5,” “text-2xl,” “flex,” “flex-col,” “items-end,” “gap-3,” “w-full,” “border,” “border-gray-300,” “rounded-md,” “p-3,” “text-sm,” and “w-1/3” are hardcoded style values.

# **ClaimNotes.jsx**

- [ ]  The component title “Notes” is hardcoded.
- [ ]  The message text “No notes available” is hardcoded.

# Note.jsx

- [ ]  The background color “bg-[#F8F8F8]” is hardcoded.
- [ ]  The CSS class names such as “p-5,” “rounded-sm,” “mb-3,” “flex,” and “justify-between” are hardcoded style values.

# **ClaimExpansionAttachmentRow.jsx**

- [ ]  The message text “No attachments available.” is hardcoded.
- [ ]  The text color “text-[#888888]” is hardcoded.
- [ ]  The CSS class names such as “flex,” “items-start,” “gap-4,” “text-sm,” “font-semibold,” “text-gray-700,” “min-w-[150px],” “pt-2,” and “flex-1” are hardcoded style values.

# **ClaimExpansionDropdownRow.jsx**

- [ ]  The placeholder text “Select a team” is hardcoded.
- [ ]  The text color “text-[#888888]” is hardcoded.
- [ ]  The CSS class names such as “flex,” “items-center,” “gap-4,” “text-sm,” “font-semibold,” “text-gray-700,” “min-w-[150px],” “flex-1,” and “w-50” are hardcoded style values.

# **ClaimExpansionInputRow.jsx**

- [ ]  The placeholder text pattern “No ${field} available.” is hardcoded.
- [ ]  The text color “text-[#888888]” is hardcoded.
- [ ]  The CSS class names such as “flex,” “items-center,” “gap-4,” “text-sm,” “font-semibold,” “min-w-[150px],” “flex-1,” and “w-50” are hardcoded style values.

# **ClaimRowExpansion.jsx**

- [ ]  The label texts “Team,” “Program / Project,” “Tags,” “Expense Description,” “Notes,” and “Attachments” are hardcoded.
- [ ]  The CSS class names such as “px-18,” “grid,” “grid-cols-1,” and “gap-4” are hardcoded style values.

# **EditableExpansionTable.jsx**

- [ ]  The CSS class names such as “bg-white,” “h-full,” “p-6,” “flex,” “justify-between,” “items-center,” “text-[22px],” “text-sm,” “text-gray-600,” “text-center,” “py-12,” “text-gray-500,” “text-lg,” “mb-2,” “gap-2,” and “w-full” are hardcoded style values.
- [ ]  The section heading text “Expense Details” is hardcoded.
- [ ]  The item count suffixes “item” and “items” used for pluralization are hardcoded.
- [ ]  The currency and locale for totals (“USD” and “en-US”) are hardcoded.
- [ ]  The empty-state texts “No expenses added yet,” “Add your first expense using the form above.,” and “This claim contains no expense items.” are hardcoded.
- [ ]  The DataTable inline style min width “50rem” (tableStyle: { minWidth: '50rem' }) is hardcoded.
- [ ]  The paginator configuration values — rows per page “5” and rowsPerPageOptions “[10, 25, 50]” — are hardcoded.
- [ ]  The DataTable empty message “No expense items to display” is hardcoded.
- [ ]  The DataTable size “small” is hardcoded.
- [ ]  The column header texts “ID,” “Transaction Date,” “Vendor,” “Account #,” “Cost Centre,” “Amount,” “Buyer,” “Status,” “Edit,” “Delete,” and “Action” are hardcoded.
- [ ]  The date editor input type “date” is hardcoded.
- [ ]  The currency editor’s configuration (“mode: 'currency', currency: 'USD', locale: 'en-US'”) is hardcoded.
- [ ]  The delete button tooltip/title text “Delete this expense” is hardcoded.
- [ ]  The delete button icon class “pi pi-trash” is hardcoded.
- [ ]  The action buttons’ labels “Approve” and “Reject” are hardcoded

# **AttchmentList.jsx**

- [ ]  The CSS class names such as “mt-4,” “text-sm,” “text-gray-700,” “flex,” “items-center,” “gap-2,” “text-blue-600,” “hover:underline,” “cursor-pointer,” and “text-red-500” are hardcoded style values.
- [ ]  The remove button text “X” is hardcoded.

# **Upload.jsx**

- [ ]  The button text “Upload a file” is hardcoded.
- [ ]  The accepted file types “image/*,applicationpdf” are hardcoded.
- [ ]  The CSS class names such as “p-button,” “p-component,” “p-button-outlined,” “p-2,” “cursor-pointer,” “flex,” “items-center,” “gap-2,” and “hidden” are hardcoded style values.
- [ ]  The icon class “pi pi-cloud-upload” is hardcoded.

# **UploadAttachment.jsx**

- [ ]  The heading text “Attachments” is hardcoded.
- [ ]  The note text “Note: Upload Receipt, contact/agreement or additional supporting documents” is hardcoded.
- [ ]  The CSS class names such as “text-[22px],” “my-2,” “flex,” “justify-center,” “items-center,” “border,” “border-gray-300,” “rounded-md,” and “p-5” are hardcoded style values.

# **getFileIcon.jsx**

- [ ]  The text colors “text-blue-500,” “text-red-500,” “text-green-500,” “text-blue-700,” and “text-gray-500” are hardcoded.
- [ ]  The CSS class names such as “inline-block” and “mr-2” are hardcoded style values.
- [ ]  The MIME type strings like “image/,” “application/pdf,” “application/vnd.ms-excel,” “application/msword,” and “application/vnd.openxmlformats-officedocument.wordprocessingml.document” are hardcoded.

# **AddExpenseForm.jsx**

- [ ]  The section heading text “Add Expenses” is hardcoded.
- [ ]  The subtext “Lorem ipsum dolor sit amet, consectetur adipisicing elit.” is hardcoded.
- [ ]  The label text “Total Amount” is hardcoded.
- [ ]  The select label “Program” is hardcoded.
- [ ]  The select placeholder “Select a program” is hardcoded.
- [ ]  The date label “Transaction Date (yyyy/mm/dd)*” is hardcoded.
- [ ]  The date placeholder “Select a transaction date” is hardcoded.
- [ ]  The select label “Cost Centre” is hardcoded.
- [ ]  The select placeholder “Select a cost centre” is hardcoded.
- [ ]  The input label “Vendor / Service Provider” is hardcoded.
- [ ]  The input placeholder “Please enter vender” is hardcoded.
- [ ]  The select label “Account Number” is hardcoded.
- [ ]  The select placeholder “Select a Account Number” is hardcoded.
- [ ]  The input label “Amount” is hardcoded.
- [ ]  The input placeholder “Please enter amount” is hardcoded.
- [ ]  The input label “Buyer” is hardcoded.
- [ ]  The input placeholder “Please enter buyer” is hardcoded.
- [ ]  The subsection heading “Expense Description” is hardcoded.
- [ ]  The textarea placeholder “Enter your message here...” is hardcoded.
- [ ]  The subsection heading “Notes” is hardcoded.
- [ ]  The textarea placeholder “Enter a text...” is hardcoded.
- [ ]  The button label “Add Expense” is hardcoded.
- [ ]  The button icon class “pi pi-check” is hardcoded.
- [ ]  The button label “Auto Fill Form” is hardcoded.
- [ ]  The textarea rows value “3” is hardcoded.
- [ ]  The CSS class names such as “bg-white,” “h-full,” “rounded-2xl,” “shadow-sm,” “flex,” “justify-between,” “items-center,” “my-6,” “bg-blue-100,” “rounded-t-2xl,” “p-6,” “text-[22px],” “text-gray-500,” “text-sm,” “text-2xl,” “my-5,” “gap-10,” “flex-wrap,” “px-6,” “flex-1,” “flex-col,” “gap-3,” “w-full,” “border,” “border-gray-300,” “rounded-md,” “p-3,” “mb-4,” and “p-5” are hardcoded style values.

Shan:

- **/src/contexts**
    
    ### ClaimContext.jsx
    
    - [ ]  Line 2 : import { *claimsData* } from '../utils/[mockData.js](http://mockdata.js/)'
    
    ### TeamContext.jsx
    
    - [ ]  Line 2: import { *mockTeams* } from '../utils/[mockData.js](http://mockdata.js/)'
    
    ### UserContext.jsx
    
    - [ ]  Line 2: import { *mockUsers* } from '../utils/[mockData.js](http://mockdata.js/)'
    
- **/src/components/feature/claims:**
    
    ### AddExpenseForm.jsx
    
    - [x]  Line 4: import { *accountNums*, *costCentres*, *programs*, *teams* } from '../../../utils/[mockData.js](http://mockdata.js/)'
    - [x]  Line 48: options={ *programs* }
    - [x]  Line 63: options={ *costCentres*.map((opt) => ( {
        
        label: `${ opt.code } - ${ opt.name }`,
        
        value: `${ opt.code } - ${ opt.name }`,
        
        } )) }
        
    - [x]  Line 81:options={ *accountNums*.map((opt) => ( {
        
        label: `${ opt.code } - ${ opt.title }`,
        
        value: `${ opt.code } - ${ opt.title }`,
        
        } )) }
        
    
    ### **ClaimForm.jsx**
    
    - [x]  Line 3: import { *claimTypes*, *teams* } from '../../../utils/[mockData.js](http://mockdata.js/)'
    - [x]  Line 28: options={ *claimTypes*.map(option=>({label:option.name,value:option.name})) }
    - [x]  Line 35: options={ *teams* }
    
    ### **ClaimListDataTable.jsx**
    
    - [x]  Line 11: import { *claimStatus*, *claimTypesFilter* } from '../../../utils/[mockData.js](http://mockdata.js/)'
    - [x]  Line 71: options={ *claimStatus* }
    - [x]  Line 78: options={ *claimTypesFilter* }
    
    ### **ClaimRowExpansion.jsx**
    
    - [x]  Line 5: import { *teams*, *programs* } from '../../../../utils/[mockData.js](http://mockdata.js/)'
    - [x]  Line 44: options={*teams*}
    - [x]  Line 55: options={*programs*}
    
    ### **EditableExpansionTable.jsx**
    
    - [x]  Line 9: import { *accountNums*, *costCentres* } from '../../../../utils/mockData.js'
    - [x]  Line 182:options={ *accountNums*.map((opt) => ( {
        
        label: `${ opt.code } - ${ opt.title }`,
        
        value: `${ opt.code } - ${ opt.title }`,
        
        } )) }
        
    - [x]  Line 194:options={ *costCentres*.map((opt) => ( {
        
        label: `${ opt.code } - ${ opt.name }`,
        
        value: `${ opt.code } - ${ opt.name }`,
        
        } )) }
        
- **/src/pages**
    
    ### **admin/TeamsPage.jsx**
    
    - [ ]  Line 10: import { *status* } from '../../utils/mockData.js'
    - [ ]  Line 65: options={*status*}
    
    ### **admin/UsersPage.jsx**
    
    - [ ]  Line 9: import { *roles*, *teams*, *status* } from '../../utils/mockData.js'
    - [ ]  Line 76: options={ *teams* }
    - [ ]  Line 85: options={ *roles* }
    - [ ]  Line 94: options={ *status* }