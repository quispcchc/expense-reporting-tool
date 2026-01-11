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
        const response = await api.get('my-claims');
        setMyClaims(response.data)
        console.log(myClaims)
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