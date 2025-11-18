export const validationSchemas = {
    login: {
        email: [
            { rule: 'required', message: 'Email is required' },
            { rule: 'email', message: 'Please enter a valid email address' },
        ],
        password: [
            { rule: 'required', message: 'Password is required' },
        ],
    },

    forgotPassword: {
        email: [
            { rule: 'required', message: 'Email is required' },
            { rule: 'email', message: 'Please enter a valid email address' },
        ],
    },

    resetPassword: {
        password: [
            { rule: 'required', message: 'Password is required' },
            { rule: 'minLength', params: [8], message: 'Password must be at least 8 characters long' },
            // { rule: 'hasUppercase', message: 'Password must contain at least one uppercase letter' },
            // { rule: 'hasLowercase', message: 'Password must contain at least one lowercase letter' },
            // { rule: 'hasNumber', message: 'Password must contain at least one number' },
            // { rule: 'hasSpecialChar', message: 'Password must contain at least one special character' },
        ],
        repeatPassword: [
            { rule: 'required', message: 'Please confirm your password' },
            { rule: 'matches', params: ['password'], message: 'Passwords must match' },
        ],
    },

    updatePassword:{
        current_password:[
            { rule: 'required', message: 'Current Password is required' },
        ],
        new_password:[
            { rule: 'required', message: 'New Password is required' },
            { rule: 'minLength', params: [8], message: 'Password must be at least 8 characters long' },
        ],
        new_password_confirmation:[
            { rule: 'required', message: 'Password Confirmation is required' },
            { rule: 'matches', params: ['new_password'], message: 'Passwords must match' },
        ],
    },

    claim: {
        employeeName: [
            { rule: 'required', message: 'Employee name is required' },
        ],
        position: [
            { rule: 'required', message: 'Position is required' },
        ],
        department: [
            { rule: 'required', message:' Department is required' },
        ],
        claimType: [
            { rule: 'required', message: 'Claim Type is required' },
        ],


    },

    expense: {
        program: [
            { rule: 'required', message: 'Program is required' }
        ],
        transactionDate: [
            { rule: 'required', message: 'Transaction Date is required' },
        ],
        costCentre: [
            { rule: 'required', message: 'Cost Centre is required' },
        ],
        vendor: [
            { rule: 'required', message: 'Vendor is required' },
        ],
        accountNum: [
            { rule: 'required', message: 'Account Number is required' },
        ],
        amount:[
            { rule: 'required', message: 'Amount is required' },
        ],
        buyer: [
            { rule: 'required', message: 'Buyer is required' },
        ],

    },

    addUser:{
        first_name:[
            { rule: 'required', message: 'Please enter first name' },
        ],
        last_name:[
            { rule: 'required', message: 'Please enter last name' },
        ],
        teams:[
            { rule: 'required', message: 'Please select team'},
        ],
        position:[
            { rule: 'required', message: 'Please enter position' },
        ],
        roles:[
            { rule: 'required', message: 'Please choose role' },
        ],
        status:[
            { rule: 'required', message: 'Please choose status' },
        ]
    },

    addTeam:{
        code:[
            { rule: 'required', message: 'Code is required' },
        ],
        name:[
            { rule: 'required', message: 'Name is required' },
        ],
        status:[
            { rule: 'required', message: 'Status is required' },
        ]
    },
    addCostCentre:{
        department:[
            { rule: 'required', message: 'Department is required' },
        ],
        code:[
            { rule: 'required', message: 'Code is required' },
        ],
        // status:[
        //     { rule: 'required', message: 'status is required' },
        // ],
        description:[
            { rule: 'required', message: 'Description is required' },
        ]
    }
}