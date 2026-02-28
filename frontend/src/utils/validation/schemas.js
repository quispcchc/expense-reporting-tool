export const validationSchemas = {
    login: {
        email: [
            { rule: 'required', messageKey: 'validation.emailRequired' },
            { rule: 'email', messageKey: 'validation.emailInvalid' },
        ],
        password: [
            { rule: 'required', messageKey: 'validation.passwordRequired' },
        ],
    },

    forgotPassword: {
        email: [
            { rule: 'required', messageKey: 'validation.emailRequired' },
            { rule: 'email', messageKey: 'validation.emailInvalid' },
        ],
    },

    resetPassword: {
        password: [
            { rule: 'required', messageKey: 'validation.passwordRequired' },
            { rule: 'minLength', params: [8], messageKey: 'validation.passwordMinLength' },
        ],
        repeatPassword: [
            { rule: 'required', messageKey: 'validation.passwordConfirmRequired' },
            { rule: 'matches', params: ['password'], messageKey: 'validation.passwordMatch' },
        ],
    },

    updatePassword: {
        current_password: [
            { rule: 'required', messageKey: 'validation.currentPasswordRequired' },
        ],
        new_password: [
            { rule: 'required', messageKey: 'validation.newPasswordRequired' },
            { rule: 'minLength', params: [8], messageKey: 'validation.passwordMinLength' },
        ],
        new_password_confirmation: [
            { rule: 'required', messageKey: 'validation.passwordConfirmRequired2' },
            { rule: 'matches', params: ['new_password'], messageKey: 'validation.passwordMatch' },
        ],
    },

    claim: {
        employeeName: [
            { rule: 'required', messageKey: 'validation.employeeNameRequired' },
        ],
        position: [
            { rule: 'required', messageKey: 'validation.positionRequired' },
        ],
        department: [
            { rule: 'required', messageKey: 'validation.departmentRequired' },
        ],
        team: [
            { rule: 'required', messageKey: 'validation.teamRequired' },
        ],
        claimType: [
            { rule: 'required', messageKey: 'validation.claimTypeRequired' },
        ],
    },

    expense: {
        program: [
            { rule: 'required', messageKey: 'validation.programRequired' },
        ],
        transactionDate: [
            { rule: 'required', messageKey: 'validation.transactionDateRequired' },
        ],
        costCentre: [
            { rule: 'required', messageKey: 'validation.costCentreRequired' },
        ],
        vendor: [
            { rule: 'required', messageKey: 'validation.vendorRequired' },
        ],
        accountNum: [
            { rule: 'required', messageKey: 'validation.accountNumRequired' },
        ],
        amount: [
            { rule: 'required', messageKey: 'validation.amountRequired' },
            { rule: 'isNumeric', messageKey: 'validation.amountNumeric' },
        ],
        buyer: [
            { rule: 'required', messageKey: 'validation.buyerRequired' },
        ],
    },

    addUser: {
        first_name: [
            { rule: 'required', messageKey: 'validation.firstNameRequired' },
        ],
        last_name: [
            { rule: 'required', messageKey: 'validation.lastNameRequired' },
        ],
        email: [
            { rule: 'required', messageKey: 'validation.enterEmail' },
        ],
        department: [
            { rule: 'required', messageKey: 'validation.selectDepartment' },
        ],
        teams: [
            { rule: 'required', messageKey: 'validation.selectTeam' },
        ],
        position: [
            { rule: 'required', messageKey: 'validation.enterPosition' },
        ],
        role: [
            { rule: 'required', messageKey: 'validation.chooseRole' },
        ],
    },

    addDepartment: {
        department_abbreviation: [
            { rule: 'required', messageKey: 'validation.codeRequired' },
        ],
        department_name: [
            { rule: 'required', messageKey: 'validation.nameRequired' },
        ],
        active_status_id: [
            { rule: 'required', messageKey: 'validation.statusRequired' },
        ],
    },

    addTeam: {
        team_abbreviation: [
            { rule: 'required', messageKey: 'validation.codeRequired' },
        ],
        team_name: [
            { rule: 'required', messageKey: 'validation.nameRequired' },
        ],
        active_status_id: [
            { rule: 'required', messageKey: 'validation.statusRequired' },
        ],
    },

    addCostCentre: {
        department: [
            { rule: 'required', messageKey: 'validation.departmentRequired' },
        ],
        code: [
            { rule: 'required', messageKey: 'validation.codeRequired' },
        ],
        description: [
            { rule: 'required', messageKey: 'validation.descriptionRequired' },
        ],
    },

    addAccountNumber: {
        accountNumber: [
            { rule: 'required', messageKey: 'validation.accountNumRequired' },
        ],
        description: [
            { rule: 'required', messageKey: 'validation.descriptionRequired' },
        ],
    },

    mileageTransaction: {
        transaction_date: [
            { rule: 'required', messageKey: 'validation.transactionDateRequired' },
        ],
        travel_from: [
            { rule: 'required', messageKey: 'validation.travelFromRequired' },
        ],
        travel_to: [
            { rule: 'required', messageKey: 'validation.travelToRequired' },
        ],
        distance_km: [
            { rule: 'requiredWithoutAll', params: [['meter_km', 'parking_amount']], messageKey: 'validation.distanceMeterParkingRequired' },
            { rule: 'isNumeric', messageKey: 'validation.distanceNumeric' },
            { rule: 'minValue', params: [0], messageKey: 'validation.distanceNonNegative' },
        ],
        parking_amount: [
            { rule: 'requiredWithoutAll', params: [['distance_km', 'meter_km']], messageKey: 'validation.distanceMeterParkingRequired' },
            { rule: 'isNumeric', messageKey: 'validation.parkingNumeric' },
            { rule: 'minValue', params: [0], messageKey: 'validation.parkingNonNegative' },
        ],
        meter_km: [
            { rule: 'requiredWithoutAll', params: [['distance_km', 'parking_amount']], messageKey: 'validation.distanceMeterParkingRequired' },
            { rule: 'isNumeric', messageKey: 'validation.meterNumeric' },
            { rule: 'minValue', params: [0], messageKey: 'validation.meterNonNegative' },
            { rule: 'maxValue', params: [5], messageKey: 'validation.meterMaxValue' },
        ],
        buyer: [
            { rule: 'required', messageKey: 'validation.buyerRequired' },
        ],
    },
}
