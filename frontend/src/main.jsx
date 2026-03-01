import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App.jsx'
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx'
import { ClaimProvider } from './contexts/ClaimContext.jsx'
import { PrimeReactProvider } from 'primereact/api'
import { LookupProvider } from './contexts/LookupContext.jsx'
import { ThemeProvider } from './contexts/ThemeContext.jsx'

// Keyed wrapper: when authUser changes (login/logout), ClaimProvider
// remounts with fresh state — no stale cache across user sessions.
function AppProviders({ children }) {
    const { authUser } = useAuth()
    return (
        <LookupProvider>
            <ClaimProvider key={authUser?.user_id ?? 'guest'}>
                {children}
            </ClaimProvider>
        </LookupProvider>
    )
}

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <ThemeProvider>
            <PrimeReactProvider>
                <AuthProvider>
                    <AppProviders>
                        <App />
                    </AppProviders>
                </AuthProvider>
            </PrimeReactProvider>
        </ThemeProvider>
    </StrictMode>,
)
