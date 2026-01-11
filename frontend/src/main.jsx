import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { ClaimProvider } from './contexts/ClaimContext.jsx'
import { PrimeReactProvider } from 'primereact/api'
import { LookupProvider } from './contexts/LookupContext.jsx'

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <PrimeReactProvider>
            <AuthProvider>
                <LookupProvider>
                    <ClaimProvider>
                        <App />
                    </ClaimProvider>
                </LookupProvider>
            </AuthProvider>
        </PrimeReactProvider>
    </StrictMode>,
)
