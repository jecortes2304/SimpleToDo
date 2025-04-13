import React from 'react';
import {useTranslation} from 'react-i18next';
import {Link} from 'react-router-dom';
import {ThemeColor} from "../schemas/globals.ts";

const NotFoundPage: React.FC = () => {
    const { t } = useTranslation();
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
    const theme = localStorage.getItem('theme') as ThemeColor || (isDarkMode ? ThemeColor.DARK : ThemeColor.LIGHT)

    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-4" data-theme={theme}>
            <h1 className="text-6xl font-bold text-error mb-4">404</h1>
            <p className="text-xl mb-6">{t('notFound.pageNotFound') || 'Página no encontrada'}</p>
            <Link to="/" className="btn btn-primary">
                {t('notFound.goHome') || 'Volver al inicio'}
            </Link>
        </div>
    );
};

export default NotFoundPage;
