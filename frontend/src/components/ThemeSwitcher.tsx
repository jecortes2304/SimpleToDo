import React, {useEffect, useState} from 'react'
import {MoonIcon, SunIcon} from '@heroicons/react/20/solid'
import {ThemeColor} from "../schemas/globals.ts";

const ThemeSwitcher: React.FC = () => {
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
    const [theme, setTheme] = useState<string>(() => localStorage.getItem('theme') || (isDarkMode ? ThemeColor.DARK : ThemeColor.LIGHT))

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme)
        localStorage.setItem('theme', theme)
    }, [theme])

    const toggleTheme = () => {
        setTheme(theme === ThemeColor.DARK ? ThemeColor.LIGHT : ThemeColor.DARK)
    }

    return (
        <button onClick={toggleTheme} className="ms-4 swap swap-rotate">
            <input type="checkbox" checked={theme === ThemeColor.DARK} readOnly/>
            <SunIcon className="swap-off fill-current w-8 h-8"/>
            <MoonIcon className="swap-on fill-current w-8 h-8"/>
        </button>
    )
}

export default ThemeSwitcher
