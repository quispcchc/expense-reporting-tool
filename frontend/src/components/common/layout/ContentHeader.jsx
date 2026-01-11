import React from 'react'
import { BreadCrumb } from 'primereact/breadcrumb'
import { FaCaretRight } from 'react-icons/fa6'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

function ContentHeader({ title, homePath }) {
    const { t } = useTranslation()
    const items = title ? [{ label: title }] : null
    const home = {
        template: () => <Link to={homePath} className="text-gray-500"><span className="pi pi-home mr-1"></span>{t('common.home')}</Link>,
    }

    return (
        <div>
            <h5 className="text-2xl">{title}</h5>
            <BreadCrumb model={items} home={home} separatorIcon={items ? <FaCaretRight /> : null} />
        </div>
    )
}

export default ContentHeader