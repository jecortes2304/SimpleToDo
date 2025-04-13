import React from 'react';
import {ThemeColor} from "../schemas/globals.ts";

const Footer: React.FC = () => {
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
    const theme = localStorage.getItem('theme') as ThemeColor || (isDarkMode ? ThemeColor.DARK : ThemeColor.LIGHT)
    return (
        <footer className="footer sm:footer-horizontal footer-center bg-base-300 text-base-content p-4" data-theme={theme}>
            <aside>
                <p>Copyright © {new Date().getFullYear()} - All right reserved by CorteStudios</p>
            </aside>
        </footer>
    );
};

export default Footer;