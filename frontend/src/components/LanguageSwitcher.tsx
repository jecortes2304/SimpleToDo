import React, {useEffect, useState} from 'react'
import i18n from "../i18n";

const LanguageSwitcher: React.FC = () => {
    const [language, setLanguage] = useState<string>(() => localStorage.getItem('i18nextLng') || 'es')

    useEffect(() => {
        i18n.changeLanguage(language).then()
    }, [language])

    const toggleLanguage = () => {
        setLanguage(language === 'es' ? 'en' : 'es')
    }

    return (
        <button onClick={toggleLanguage} className="btn btn-circle btn-ghost">{language === 'en' ? 'ES' : 'EN'}</button>
    )
}

export default LanguageSwitcher
