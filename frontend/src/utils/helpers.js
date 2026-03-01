export const generateId = () => {
    return Math.floor(100000 + Math.random() * 900000)
}

export const TOAST_LIFE = { SUCCESS: 3000, ERROR: 5000, INFO: 3000 }

export const showToast = (toastRef, { severity = 'info', summary = '', detail = '', life = 3000 }) => {
    if (toastRef?.current) {
        toastRef.current.show({ severity, summary, detail, life })
    }
}

