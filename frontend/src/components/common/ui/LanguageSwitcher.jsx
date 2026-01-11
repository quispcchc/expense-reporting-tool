import React from 'react'
import { useTranslation } from 'react-i18next'

function LanguageSwitcher() {
    const { i18n } = useTranslation()

    const currentLang = i18n.language?.substring(0, 2) || 'en'

    const toggleLanguage = () => {
        const newLang = currentLang === 'en' ? 'fr' : 'en'
        i18n.changeLanguage(newLang)
    }

    return (
        <button
            onClick={toggleLanguage}
            className="flex items-center justify-center w-12 h-12 rounded-lg bg-[var(--color-bg-secondary)] hover:bg-[var(--color-border)] transition-colors"
            aria-label={currentLang === 'en' ? 'Switch to French' : 'Switch to English'}
            title={currentLang === 'en' ? 'Français' : 'English'}
        >
            <span className="text-base font-medium text-[var(--color-text-primary)]">
                {currentLang.toUpperCase()}
            </span>
        </button>
    )
}

export default LanguageSwitcher
