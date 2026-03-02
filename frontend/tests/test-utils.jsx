/* eslint-disable react-refresh/only-export-components */
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../src/contexts/AuthContext.jsx'
import { ClaimProvider } from '../src/contexts/ClaimContext.jsx'
import { LookupProvider } from '../src/contexts/LookupContext.jsx'
import { ThemeProvider } from '../src/contexts/ThemeContext.jsx'

function AllProviders({ children, routerProps = {} }) {
    return (
        <ThemeProvider>
            <AuthProvider>
                <LookupProvider>
                    <ClaimProvider>
                        <MemoryRouter {...routerProps}>
                            {children}
                        </MemoryRouter>
                    </ClaimProvider>
                </LookupProvider>
            </AuthProvider>
        </ThemeProvider>
    )
}

export function renderWithProviders(ui, options = {}) {
    const { routerProps, ...renderOptions } = options
    return render(ui, {
        wrapper: (props) => <AllProviders {...props} routerProps={routerProps} />,
        ...renderOptions,
    })
}

export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'
