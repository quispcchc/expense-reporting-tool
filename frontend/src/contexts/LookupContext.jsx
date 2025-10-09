import { createContext, useContext, useEffect, useState } from 'react'
import api from '../api/api.js'

const LookupContext = createContext()

export function LookupProvider ({ children }) {
    const [lookups, setLookups] = useState({
        roles: [],
        teams: [],
        positions: [],
        activeStatuses: [],
        departments:[]
    })
    const [loading, setLoading] = useState(true)

    const fetchLookups = async () => {
        setLoading(true)
        try {
            const { data } = await api.get('lookups')
            console.log(data)
            setLookups({
                roles: data.roles,
                teams: data.teams,
                activeStatuses: data.active_statuses,
                positions:data.positions,
                departments: data.departments
            })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchLookups()
    }, [])


    return (
        <LookupContext.Provider value={{lookups,loading}}>
            { children }
        </LookupContext.Provider>
    )

}


export const useLookups = () => useContext(LookupContext)

