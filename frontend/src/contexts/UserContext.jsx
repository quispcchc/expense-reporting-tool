import { createContext, useContext, useReducer } from 'react'
import { mockUsers } from '../utils/mockData.js'

const UserContext = createContext()
const UserDispatchContext = createContext()

const initialState = [...mockUsers]

const userReducer = (state, action) => {
    switch (action.type) {
        case 'create':
            return [...state, action.payload]

        case 'update':
            return state.map(user =>
                user.user_id === action.payload.user_id ? { ...user, ...action.payload } : user,
            )

        default:
            return state
    }
}

export const UserProvider = ({ children }) => {
    const [state, dispatch] = useReducer(userReducer, initialState)

    return <UserContext.Provider value={ state }>
        <UserDispatchContext.Provider value={ dispatch }>
            { children }
        </UserDispatchContext.Provider>

    </UserContext.Provider>

}

export const useUser = ()=> {
    return useContext(UserContext)
}
export const useUserDispatch = ()=> {
    return useContext(UserDispatchContext)
}