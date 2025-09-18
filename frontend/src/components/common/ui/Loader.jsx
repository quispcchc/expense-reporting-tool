import React from 'react'
import { ProgressSpinner } from 'primereact/progressspinner'

function Loader (props) {
    return (
        <div className="fixed inset-0 z-50 bg-black/20 flex items-center justify-center">
            <ProgressSpinner/>
        </div>
    )
}

export default Loader