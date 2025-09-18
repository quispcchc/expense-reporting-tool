import React from 'react'
import { BreadCrumb } from 'primereact/breadcrumb'
import { FaCaretRight } from 'react-icons/fa6'
import { Link } from 'react-router-dom'

function ContentHeader ({ title, homePath }) {
    const items = title ? [{ label: title }] : null
    const home = {
        template: () => <Link to={ homePath } className="text-gray-500"><span className="pi pi-home mr-1"></span>Home</Link>,
    }

    return (
        <div>
            <h5 className="text-2xl">{ title }</h5>
            <BreadCrumb model={ items } home={ home } separatorIcon={ items ? <FaCaretRight/> : null }/>
        </div>
    )
}

export default ContentHeader