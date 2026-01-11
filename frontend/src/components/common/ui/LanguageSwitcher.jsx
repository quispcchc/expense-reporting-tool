import React from 'react'
import { useTranslation } from 'react-i18next'
import { Dropdown } from 'primereact/dropdown'

const languageOptions = [
    { label: 'English', value: 'en', flag: '🇨🇦' },
    { label: 'Français', value: 'fr', flag: '🇨🇦' }
]

function LanguageSwitcher() {
    const { i18n } = useTranslation()

    const handleLanguageChange = (e) => {
        i18n.changeLanguage(e.value)
    }

    const selectedLanguageTemplate = (option) => {
        if (option) {
            return (
                <div className="flex items-center gap-2">
                    <span>{option.flag}</span>
                    <span>{option.label}</span>
                </div>
            )
        }
        return <span>Select Language</span>
    }

    const languageOptionTemplate = (option) => {
        return (
            <div className="flex items-center gap-2 p-2">
                <span>{option.flag}</span>
                <span>{option.label}</span>
            </div>
        )
    }

    return (
        <Dropdown
            value={i18n.language?.substring(0, 2) || 'en'}
            options={languageOptions}
            onChange={handleLanguageChange}
            valueTemplate={selectedLanguageTemplate}
            itemTemplate={languageOptionTemplate}
            className="w-32"
        />
    )
}

export default LanguageSwitcher
