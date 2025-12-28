import React, {FormEvent, useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {useAlert} from '../hooks/useAlert'
import {useNavigate} from 'react-router-dom'
import {GenderType, RegisterDto} from "../schemas/auth.ts";
import {ApiResponse, ThemeColor} from "../schemas/globals.ts";
import "react-day-picker/style.css";
import {CurrentUserMe, getCurrentUser, login, register} from "../services/AuthService.ts";
import {
    CalendarIcon,
    EnvelopeIcon,
    EyeIcon,
    LockClosedIcon,
    PhoneIcon,
    UserCircleIcon,
    UserIcon
} from "@heroicons/react/16/solid";
import {DayPicker, MonthsDropdown, YearsDropdown} from "react-day-picker";
import useAuthStore from '../store/authStore';

const AuthPage: React.FC = () => {
    const {t} = useTranslation()
    const alert = useAlert()
    const navigate = useNavigate()
    const {setAuth} = useAuthStore()

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

    const [isLoading, setIsLoading] = useState<boolean>(false);

    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
    const theme = localStorage.getItem('theme') as ThemeColor || (isDarkMode ? ThemeColor.DARK : ThemeColor.LIGHT)


    useEffect(() => {
        // If the user is already authenticated, redirect to home
        (async () => {
            const res = await getCurrentUser()
            if (res.ok && res.result) {
                const {id, email, role} = res.result as CurrentUserMe
                setAuth({id, email, role})
                navigate('/', {replace: true})
            }
        })()
    }, [])


    const toggleMode = () => setIsLogin(!isLogin)

    const handlerAuthErrors = (response: ApiResponse<any>) => {
        setIsLoading(false);
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

        setIsLoading(true);

        if (!email || !password || (!isLogin && !username)) {
            alert(t('auth.fieldsRequired'), 'alert-error')
            setIsLoading(false)
            return
        }

        if (isLogin) {
            const response = await login({email, password})
            if (response.ok && response.statusCode === 200) {
                setIsLoading(false);
                // After login, fetch current user info
                const me = await getCurrentUser()
                if (me.ok && me.result) {
                    const {id, email: userEmail, role} = me.result as CurrentUserMe
                    setAuth({id, email: userEmail, role})
                }
                alert(t('auth.loginSuccess'), 'alert-success')
                navigate('/', {replace: true})
            } else {
                handlerAuthErrors(response as ApiResponse<any>)
            }
        } else {
            const age = date ? new Date().getFullYear() - date.getFullYear() : 0
            if (age < 16 || age > 120) {
                alert(t('auth.ageRestriction'), 'alert-error')
                setIsLoading(false)
                return
            }

            const userToRegister: RegisterDto = {
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
            }
            const response = await register(userToRegister)
            if (response.ok && (response.statusCode === 201 || response.statusCode === 200)) {
                setIsLoading(false);
                alert(t('auth.registerSuccess'), 'alert-success')
                setTimeout(() => {
                    navigate('/pending-email-verification', {state: {email: email}});
                })
            } else {
                handlerAuthErrors(response as ApiResponse<any>)
            }
        }
    }

    const toggleVisibility = (e: React.MouseEvent<SVGSVGElement>) => {
        e.preventDefault();
        const input = e.currentTarget.parentElement?.querySelector('input');
        if (input) {
            input.type = input.type === 'password' ? 'text' : 'password';
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-base-200 py-12" data-theme={theme}>
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
                                <EyeIcon className="cursor-pointer rounded-full h-[1em] opacity-50"
                                         onClick={toggleVisibility}/>
                            </label>
                            <p className="validator-hint">
                                {t('auth.passwordHint')}
                            </p>
                        </div>

                        <div className="text-right w-full" hidden={!isLogin}>
                            <button
                                type="button"
                                className="link link-primary text-sm"
                                onClick={() => navigate('/forgot-password')}
                            >
                                {t('auth.forgotPassword')}
                            </button>
                        </div>
                    </>
                    <div className="form-control mt-6">
                        {isLoading ? (
                                <div className="justify-center flex mb-4">
                                    <span className="loading loading-spinner loading-lg text-primary mb-4"/>
                                </div>
                            ) :
                            (
                                <button type="submit" className="btn btn-primary mx-auto">
                                    {isLogin ? t('auth.login') : t('auth.register')}
                                </button>
                            )
                        }
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