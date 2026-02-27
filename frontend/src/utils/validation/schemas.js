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

    updatePassword: {
        current_password: [
            { rule: 'required', message: 'Current Password is required' },
        ],
        new_password: [
            { rule: 'required', message: 'New Password is required' },
            { rule: 'minLength', params: [8], message: 'Password must be at least 8 characters long' },
        ],
        new_password_confirmation: [
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
            { rule: 'required', message: ' Department is required' },
        ],
        team: [
            { rule: 'required', message: ' Team is required' },
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
        amount: [
            { rule: 'required', message: 'Amount is required' },
            { rule: 'isNumeric', message: 'Amount must be a number' },

        ],
        buyer: [
            { rule: 'required', message: 'Buyer is required' },
        ],


    },

    addUser: {
        first_name: [
            { rule: 'required', message: 'Please enter first name' },
        ],
        last_name: [
            { rule: 'required', message: 'Please enter last name' },
        ],
        email: [
            { rule: 'required', message: 'Please enter email' },
        ],
        department: [
            { rule: 'required', message: 'Please select department' },
        ],
        teams: [
            { rule: 'required', message: 'Please select team' },
        ],
        position: [
            { rule: 'required', message: 'Please enter position' },
        ],
        role: [
            { rule: 'required', message: 'Please choose role' },
        ],
    },

    addDepartment: {
        department_abbreviation: [
            { rule: 'required', message: 'Code is required' },
        ],
        department_name: [
            { rule: 'required', message: 'Name is required' },
        ],
        active_status_id: [
            { rule: 'required', message: 'Status is required' },
        ],
    },

    addTeam: {
        team_abbreviation: [
            { rule: 'required', message: 'Code is required' },
        ],
        team_name: [
            { rule: 'required', message: 'Name is required' },
        ],
        active_status_id: [
            { rule: 'required', message: 'Status is required' },
        ],
    },
    addCostCentre: {
        department: [
            { rule: 'required', message: 'Department is required' },
        ],
        code: [
            { rule: 'required', message: 'Code is required' },
        ],
        // status:[
        //     { rule: 'required', message: 'status is required' },
        // ],
        description: [
            { rule: 'required', message: 'Description is required' },
        ]
    },
    addAccountNumber: {
        accountNumber: [
            { rule: 'required', message: 'Account Number is required' },
        ],
        description: [
            { rule: 'required', message: 'Description is required' },
        ]
    },

    mileageTransaction: {
        transaction_date: [
            { rule: 'required', message: 'Transaction Date is required' },
        ],
        travel_from: [
            { rule: 'required', message: 'Travel From is required' },
        ],
        travel_to: [
            { rule: 'required', message: 'Travel To is required' },
        ],
        distance_km: [
            { rule: 'requiredWithoutAll', params: [['meter_km', 'parking_amount']], message: 'Distance, Meter, or Parking is required' },
            { rule: 'isNumeric', message: 'Distance must be a number' },
            { rule: 'minValue', params: [0], message: 'Distance cannot be negative' },
        ],
        parking_amount: [
            { rule: 'requiredWithoutAll', params: [['distance_km', 'meter_km']], message: 'Distance, Meter, or Parking is required' },
            { rule: 'isNumeric', message: 'Parking must be a number' },
            { rule: 'minValue', params: [0], message: 'Parking cannot be negative' },
        ],
        meter_km: [
            { rule: 'requiredWithoutAll', params: [['distance_km', 'parking_amount']], message: 'Distance, Meter, or Parking is required' },
            { rule: 'isNumeric', message: 'Meter must be a number' },
            { rule: 'minValue', params: [0], message: 'Meter cannot be negative' },
            { rule: 'maxValue', params: [5], message: 'Meter cannot be greater than 5' },
        ],
        buyer: [
            { rule: 'required', message: 'Buyer is required' },
        ],
    },
}