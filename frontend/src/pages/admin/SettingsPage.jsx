import React, { useState } from 'react'
import ContentHeader from '../../components/common/layout/ContentHeader.jsx'
import { Button } from 'primereact/button'
import Input from '../../components/common/ui/Input.jsx'

function SettingsPage () {
    const [rate, setRate] = useState(0.5)

    const handleRateSubmit = (e)=> {
        console.log(rate)
    }
    return (
        <>
            <div className='flex justify-between'>
                <ContentHeader title="Tags" homePath="/admin"/>
                <Button label="Save" onClick={handleRateSubmit}/>

            </div>

            <form className="bg-white rounded-xl p-6">
                <Input label="Default mileage rate(per km)" type="number" value={ rate }
                       onChange={ (e) => setRate(e.target.value) }/>
            </form>
        </>
    )


}

export default SettingsPage