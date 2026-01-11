import React, { useEffect, useState } from 'react'
import ContentHeader from '../../components/common/layout/ContentHeader.jsx'
import ClaimListDataTable from '../../components/feature/claims/ClaimListDataTable.jsx'
import api from '../../api/api.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useTranslation } from 'react-i18next'

function MyClaimPage() {
    const [myClaims, setMyClaims] = useState([])

    const { t } = useTranslation()
    const { authUser } = useAuth()
    const path = authUser.role_name === 'regular_user' ? '/user' : '/admin'

    async function fetchMyClaims() {
        try {
            const response = await api.get('my-claims');
            // Backend returns standardized response: { status: true, data: [...], ... }
            // We need to unwrap the 'data' property.
            setMyClaims(response.data.data)
            console.log('Fetched my claims:', response.data.data)
        } catch (error) {
            console.error("Error fetching my claims:", error)
        }
    }

    useEffect(() => {
        const fetchData = async () => {
            await fetchMyClaims()
        }
        fetchData()
    }, [])


    return (
        <>
            <p className="text-2xl my-3">{t('claims.title')}</p>
            <ContentHeader homePath={path} />
            <ClaimListDataTable claims={myClaims} path={path} user='user' />
        </>
    )
}

export default MyClaimPage