import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { ClaimProvider } from './contexts/ClaimContext.jsx'
import { PrimeReactProvider } from 'primereact/api'
import { LookupProvider } from './contexts/LookupContext.jsx'
import { TagProvider } from './contexts/TagContext.jsx'
import { ThemeProvider } from './contexts/ThemeContext.jsx'

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <ThemeProvider>
            <PrimeReactProvider>
                <AuthProvider>
                    <LookupProvider>
                        <TagProvider>
                            <ClaimProvider>
                                <App />
                            </ClaimProvider>
                        </TagProvider>
                    </LookupProvider>
                </AuthProvider>
            </PrimeReactProvider>
        </ThemeProvider>
    </StrictMode>,
)

