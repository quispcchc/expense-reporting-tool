export const generateId = () => {
    return Math.floor(100000 + Math.random() * 900000)
}

export const showToast = (toastRef, { severity = 'info', summary = '', detail = '', life = 3000 }) => {
    if (toastRef?.current) {
        toastRef.current.show({ severity, summary, detail, life })
    }
}

export function autoFillForm (setFormData) {
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

export const exportToCSVManual = (claims) => {
    if (claims.length === 0) {
        alert('Please select at least one claim to export')
        return
    }

    try {
        // Helper function to escape CSV values
        const escapeCSVValue = (value) => {
            if (value === null || value === undefined) return ''
            const stringValue = String(value)
            // If value contains comma, quotes, or newlines, wrap in quotes and escape internal quotes
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                return `"${ stringValue.replace(/"/g, '""') }"`
            }
            return stringValue
        }

        let headers = [
            'Claim ID',
            'Employee Name',
            'Position',
            'Transaction ID',
            'Transaction Date',
            'Program',
            'Team',
            'Vendor',
            'Buyer',
            'Cost Centre',
            'Account #',
            'Amount',
            'Description',
            'Tags',
            'Status',
            'Date Submitted',
        ]

        let rows = []

        claims.forEach(claim => {
            claim.claimItems?.forEach(item => {
                rows.push([
                    escapeCSVValue(claim.claimId),
                    escapeCSVValue(claim.employeeName),
                    escapeCSVValue(claim.position),
                    escapeCSVValue(claim.status),
                    escapeCSVValue(claim.dateSubmitted),

                    escapeCSVValue(item.transactionId),
                    escapeCSVValue(item.transactionDate),
                    escapeCSVValue(item.program),
                    escapeCSVValue(item.team),
                    escapeCSVValue(item.vendor),
                    escapeCSVValue(item.buyer),
                    escapeCSVValue(item.costCentre),
                    escapeCSVValue(item.accountNum),
                    escapeCSVValue(item.amount),
                    escapeCSVValue(item.description),
                    escapeCSVValue(item.tags?.join('; ')),

                ].join(','))
            })
        })

        // Create CSV content
        const csvContent = [headers.join(','), ...rows].join('\n')

        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')

        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob)
            link.setAttribute('href', url)
            link.setAttribute('download', `claims_export_${ new Date().toISOString().split('T')[ 0 ] }.csv`)
            link.style.visibility = 'hidden'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
        }

        console.log(`✅ Exported ${ claims.length } claims to CSV`)
    }
    catch
        (error) {
        console.error('Error exporting CSV:', error)
        alert('Error exporting CSV. Please try again.')
    }
}

