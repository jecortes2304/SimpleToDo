import React from 'react'
import {useTranslation} from "react-i18next";


const UsersPage: React.FC = () => {
    const { t } = useTranslation()

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">{t('users.users')}</h1>
        </div>
    )

}

export default UsersPage