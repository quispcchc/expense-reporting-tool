import React from 'react'
import { BreadCrumb } from 'primereact/breadcrumb'
import { FaCaretRight } from 'react-icons/fa6'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { IoDocumentTextOutline, IoCreateOutline, IoSettingsOutline } from 'react-icons/io5'
import { TbUsers } from 'react-icons/tb'
import { PiOfficeChair } from 'react-icons/pi'
import { BsTag } from 'react-icons/bs'

// Icon mapping for each page
const iconMap = {
    'claims.allClaimsTitle': IoDocumentTextOutline,
    'claims.myClaimsTitle': IoDocumentTextOutline,
    'claims.createClaim': IoCreateOutline,
    'sidebar.users': TbUsers,
    'sidebar.teams': PiOfficeChair,
    'sidebar.costCentre': IoDocumentTextOutline,
    'sidebar.tags': BsTag,
    'sidebar.settings': IoSettingsOutline,
}

function ContentHeader({ title, homePath, className = 'mb-4', iconKey, breadcrumbItems }) {
    const { t } = useTranslation()
    const Icon = iconKey ? iconMap[iconKey] : null

    // Build breadcrumb items from prop or from title
    let items
    if (breadcrumbItems && breadcrumbItems.length > 0) {
        // Use custom breadcrumb items
        items = breadcrumbItems.slice(1).map((item, index, arr) => {
            const isLast = index === arr.length - 1
            return {
                template: () => isLast ? (
                    <span className="flex items-center gap-2 text-brand-primary font-semibold text-lg md:text-xl">
                        {Icon && <Icon className="text-xl md:text-2xl" />}
                        {item.label}
                    </span>
                ) : (
                    <Link to={item.path} className="text-text-secondary hover:text-brand-primary transition-colors text-lg">
                        {item.label}
                    </Link>
                )
            }
        })
    } else if (title) {
        items = [{
            template: () => (
                <span className="flex items-center gap-2 text-brand-primary font-semibold text-lg md:text-xl">
                    {Icon && <Icon className="text-xl md:text-2xl" />}
                    {title}
                </span>
            )
        }]
    } else {
        items = null
    }

    const home = {
        template: () => <Link to={homePath} className="text-text-secondary hover:text-brand-primary transition-colors text-lg"><span className="pi pi-home mr-1"></span>{t('common.home')}</Link>,
    }

    return (
        <div className={`flex items-center flex-wrap ${className}`}>
            <BreadCrumb model={items} home={home} separatorIcon={items ? <FaCaretRight className="mx-1 text-text-secondary text-sm" /> : null} className="p-0 border-0 bg-transparent" />
        </div>
    )
}

export default ContentHeader
