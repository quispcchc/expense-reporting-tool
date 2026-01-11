export const generateId = () => {
    return Math.floor(100000 + Math.random() * 900000)
}

export const showToast = (toastRef, { severity = 'info', summary = '', detail = '', life = 3000 }) => {
    if (toastRef?.current) {
        toastRef.current.show({ severity, summary, detail, life })
    }
}

export function autoFillForm(setFormData) {
    setFormData({
        program: 1,
        transactionDate: '2025-07-01',
        costCentre: 1,
        vendor: 'Food Basics',
        accountNum: 1,
        amount: 33,
        buyer: 'Shan',
        description: 'This is for test',
        notes: 'This is for test',
    })
}
