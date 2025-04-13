import React, {FormEvent, useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {useAlert} from '../hooks/useAlert'
import {useNavigate} from 'react-router-dom'
import {GenderType, TokenResponse} from "../schemas/auth.ts";
import {ApiResponse, ThemeColor} from "../schemas/globals.ts";
import "react-day-picker/style.css";
import {login, register} from "../services/AuthService.ts";
import {
    CalendarIcon,
    EnvelopeIcon,
    LockClosedIcon,
    PhoneIcon,
    UserCircleIcon,
    UserIcon
} from "@heroicons/react/16/solid";
import {DayPicker, MonthsDropdown, YearsDropdown} from "react-day-picker";

const AuthPage: React.FC = () => {
    const {t} = useTranslation()
    const alert = useAlert()
    const navigate = useNavigate()

    const [isLogin, setIsLogin] = useState(true)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    // Only for register
    const [username, setUsername] = useState<string>('')
    const [phone, setPhone] = useState<string>('')
    const [firstName, setFirstName] = useState<string>('')
    const [lastName, setLastName] = useState<string>('')
    const [gender, setGender] = useState<GenderType | string>('male')
    const [date, setDate] = useState<Date | undefined>();

    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
    const theme = localStorage.getItem('theme') as ThemeColor || (isDarkMode ? ThemeColor.DARK : ThemeColor.LIGHT)


    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            navigate('/', {replace: true});
        }
    }, []);


    const toggleMode = () => setIsLogin(!isLogin)

    const handlerAuthErrors = (response: ApiResponse<any>) => {
        if (response.errors instanceof Array) {
            response.errors.forEach((error) => {
                alert(error, 'alert-error')
            })
        } else {
            const messageFormatted = (response.errors as string).slice(0, 1).toUpperCase() + (response.errors as string).slice(1)
            alert(messageFormatted, 'alert-error')
        }
    }

    const handleSubmit = async (e: FormEvent) => {
        e.stopPropagation()
        e.preventDefault()


        if (!email || !password || (!isLogin && !username)) {
            alert(t('auth.fieldsRequired'), 'alert-error')
            return
        }

        if (isLogin) {
            const response = await login({email, password})
            if (response.ok && response.statusCode === 200) {
                const tokenResponse = response.result as TokenResponse
                localStorage.setItem('token', tokenResponse.token || '')
                alert(t('auth.loginSuccess'), 'alert-success')
                navigate('/', {replace: true})
            } else {
                handlerAuthErrors(response as ApiResponse<any>)
            }
        } else {
            const age = date ? new Date().getFullYear() - date.getFullYear() : 0
            if (age < 16 || age > 120) {
                alert(t('auth.ageRestriction'), 'alert-error')
                return
            }
            const response = await register({
                username: username,
                email: email,
                password: password,
                phone: phone,
                firstName: firstName,
                lastName: lastName,
                gender: gender,
                age: age,
                address: '',
                birthDate: date ? date.toISOString() : ''
            })
            if (response.ok && (response.statusCode === 201 || response.statusCode === 200)) {
                alert(t('auth.registerSuccess'), 'alert-success')
                setTimeout(() => {
                    navigate('/', {replace: true})
                })
            } else {
                handlerAuthErrors(response as ApiResponse<any>)
            }
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-base-200" data-theme={theme}>
            <div className="w-full max-w-md p-8 space-y-4 bg-base-100 shadow-xl rounded-lg">
                <h2 className="text-2xl font-bold text-center">
                    {isLogin ? t('auth.loginTitle') : t('auth.registerTitle')}
                </h2>

                <form className="space-y-2 flex flex-col items-center" onSubmit={handleSubmit}>
                    {!isLogin && (
                        <>
                            <div className="form-control w-full mx-auto">
                                <label className="input validator w-full">
                                    <UserIcon className="h-[1em] opacity-50"/>
                                    <input
                                        placeholder={t('auth.firstNamePlaceholder')}
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        type="input"
                                        required
                                        minLength={2}
                                        maxLength={100}
                                        title={t('auth.firstNameHint')}/>
                                </label>
                                <p className="validator-hint">
                                    {t('auth.firstNameHint')}
                                </p>
                            </div>

                            <div className="form-control w-full mx-auto">
                                <label className="input validator w-full">
                                    <UserIcon className="h-[1em] opacity-50"/>
                                    <input
                                        placeholder={t('auth.lastNamePlaceholder')}
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        type="input"
                                        required
                                        minLength={2}
                                        maxLength={100}
                                        title={t('auth.lastNameHint')}/>
                                </label>
                                <p className="validator-hint">
                                    {t('auth.lastNameHint')}
                                </p>
                            </div>

                            <div className="form-control w-full mx-auto">
                                <label className="input validator w-full">
                                    <UserCircleIcon className="h-[1em] opacity-50"/>
                                    <input
                                        placeholder={t('auth.usernamePlaceholder')}
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        type="input"
                                        required
                                        minLength={2}
                                        maxLength={100}
                                        title={t('auth.usernameHint')}/>
                                </label>
                                <p className="validator-hint">
                                    {t('auth.usernameHint')}
                                </p>
                            </div>

                            <div className="form-control w-full mx-auto">
                                <label className="input validator w-full">
                                    <PhoneIcon className="h-[1em] opacity-50"/>
                                    <input
                                        placeholder={t('auth.phonePlaceholder')}
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        type="tel"
                                        required
                                        minLength={4}
                                        maxLength={15}
                                        title={t('auth.phoneHint')}/>
                                </label>
                                <p className="validator-hint">
                                    {t('auth.phoneHint')}
                                </p>
                            </div>


                            <div className="w-full mx-auto">
                                <button type="button" popoverTarget="rdp-popover" className="input input-border w-full"
                                        style={{anchorName: "--rdp"} as React.CSSProperties}>
                                    <CalendarIcon className="h-[1em] opacity-50"/>
                                    {date ? date.toLocaleDateString() : t('auth.birthdatePlaceholder')}
                                </button>
                                <div popover="auto" id="rdp-popover" className="dropdown"
                                     style={{positionAnchor: "--rdp"} as React.CSSProperties}>
                                    <DayPicker
                                        components={{
                                            YearsDropdown: props => <YearsDropdown {...props}
                                                                                   className="dropdown bg-base-100/60"/>,
                                            MonthsDropdown: props => <MonthsDropdown {...props}
                                                                                     className="dropdown bg-base-100/60"/>
                                        }}
                                        captionLayout="dropdown"
                                        dropdown-years={true}
                                        className="react-day-picker"
                                        mode="single"
                                        selected={date}
                                        onSelect={setDate}/>
                                </div>
                            </div>


                            <div className="form-control w-full mx-auto mt-5 mb-8">
                                <select
                                    defaultValue={t('auth.genderPlaceholder')}
                                    className="select w-full"
                                    onChange={(e) => {
                                        setGender(e.target.value)
                                    }}>
                                    <option disabled={true}>{t('auth.genders')}</option>
                                    <option key={1} value={'male'}>
                                        {t('auth.male')}
                                    </option>
                                    <option key={2} value={'female'}>
                                        {t('auth.female')}
                                    </option>
                                </select>
                            </div>
                        </>
                    )}
                    <>
                        <div className="form-control w-full mx-auto">

                            <label className="input validator w-full">
                                <EnvelopeIcon className="h-[1em] opacity-50"/>
                                <input
                                    placeholder={t('auth.emailPlaceholder')}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    type="email"
                                    required
                                    minLength={5}
                                    maxLength={100}
                                    title={t('auth.emailHint')}/>
                            </label>
                            <p className="validator-hint">
                                {t('auth.emailHint')}
                            </p>
                        </div>

                        <div className="form-control w-full mx-auto">

                            <label className="input validator w-full">
                                <LockClosedIcon className="h-[1em] opacity-50"/>
                                <input
                                    placeholder={t('auth.passwordPlaceholder')}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    type="password"
                                    required
                                    minLength={6}
                                    maxLength={50}
                                    title={t('auth.passwordHint')}/>
                            </label>
                            <p className="validator-hint">
                                {t('auth.passwordHint')}
                            </p>
                        </div>
                    </>

                    <div className="form-control mt-6">
                        <button type="submit" className="btn btn-primary mx-auto">
                            {isLogin ? t('auth.login') : t('auth.register')}
                        </button>
                    </div>
                </form>

                <div className="text-center">
                    <p>
                        {isLogin ? t('auth.noAccount') : t('auth.haveAccount')}{' '}
                        <button className="link link-primary" onClick={toggleMode}>
                            {isLogin ? t('auth.register') : t('auth.login')}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default AuthPage