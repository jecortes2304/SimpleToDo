import React, {useEffect, useState} from 'react';
import {ThemeColor} from "../schemas/globals.ts";
import useAppStore from "../store/appStore.ts";

const Footer: React.FC = () => {
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
    const [theme, setTheme] = useState<ThemeColor>(localStorage.getItem('theme') as ThemeColor || (isDarkMode ? ThemeColor.DARK : ThemeColor.LIGHT))
    const {refreshTheme} = useAppStore()

    useEffect(() => {
        setTheme(localStorage.getItem('theme') as ThemeColor || (isDarkMode ? ThemeColor.DARK : ThemeColor.LIGHT))
    }, [refreshTheme]);

    return (
        <footer className="fixed bottom-0 w-full
        footer sm:footer-horizontal footer-center bg-base-300 text-base-content p-4" data-theme={theme}>
            <aside>
                <p>Copyright © {new Date().getFullYear()} - All right reserved by CorteStudios</p>
            </aside>
        </footer>
    );
};

export default Footer;