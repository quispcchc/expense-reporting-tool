import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { ClaimProvider } from './contexts/ClaimContext.jsx'
import { PrimeReactProvider } from 'primereact/api';


createRoot(document.getElementById('root')).render(
    <StrictMode>
        <PrimeReactProvider>
                <AuthProvider>
                    <ClaimProvider>
                        <App/>
                    </ClaimProvider>
                </AuthProvider>
        </PrimeReactProvider>
    </StrictMode>,
)
