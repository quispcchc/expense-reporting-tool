#  Expense And Revenue Reporting Tool Backend Documentation 

 

Completed by:  

 

Nguyen Dung Vo, 

Backend Developer 

 

Group White 

Algonquin College 

 

 

## Technical Deliverables 

### A/ Basic controllers: 

Basic controllers contain basic HTTP methods for the tables (GET, POST, Delete, Put): 

Claim Controller: This controller manages the Claim table, handling the retrieval, updating, and deletion of data.    

Cost Centre Controller: This controller manages the Cost Centre table, handling the retrieval, updating, and deletion of data. 

Expense Controller: This controller manages the Expense table, handling the retrieval, updating, and deletion of data. 

Position Controller: This controller manages the Position table, handling the retrieval, updating, and deletion of data. 

Mileage Controller: This controller manages the Mileage table, handling the retrieval, updating, and deletion of data. 

Project Controller: This controller manages the Project table, handling the retrieval, updating, and deletion of data. 

Role Controller: This controller manages the Role table, handling the retrieval, updating, and deletion of data. 

Team Controller: This controller manages the Team table, handling the retrieval, updating, and deletion of data. 

### B/ Specific Controller and folder 

Each controller and folder are designed for a specific scope and serve a distinct purpose. 

#### 1/ Controller: 

Kernel: The central middleware manager that defines global, grouped, and route-specific middleware for the application. 

Login & logout function: The Login and Logout controllers manage user authentication, issuing and invalidating Bearer tokens to track and control authenticated sessions. 

Current User Controller: This controller is used to retrieve the currently authenticated user’s details. 

Forget Password function: Password reset involves two controllers: ForgetPasswordController issues a Bearer token via email, and ResetPasswordController validates the token, identifies the user, and updates the account password. 

New Claim Controller: this controller uses for creating new claim and stores it in database. 

Claim Updated Notification Controller: This controller handles sending notifications to users when their claim information changes. 

Notification Controller: Responsible for receiving a notification request, locating the user associated with a given claim, and sending a claim update notification to that user. 

#### 2/ Folder 

The Notification folder contains classes for customizing and modifying email messages sent to users 

The Middleware folder contains middleware classes for authentication and role-based access control, including admin middleware. 

Database contains migration files responsible for defining, creating, and updating the SQLite database structure. Each migration file manages a specific table. 

### C/ Authorization logic 

Determines whether a user can access a specific function. A “role_level” column in the Role table is used to separate authorization levels, allowing different role names to share the same permission level. Role levels range from 0 upward, depending on the system’s requirements  

 

## Recommendations for Future Development 

Using Encrypt and Decrypt function for new claim controller to protect the claim information. 

Adjusting the database structure to meet updated project requirements. 

 

## Notes:

All completed and thoroughly tested data and functionalities are merged into the main branch on GitHub. Functions that are still under development or have not yet been tested are maintained in a separate feature branch. 


