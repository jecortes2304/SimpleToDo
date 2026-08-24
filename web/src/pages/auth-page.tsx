import React, {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {useAlert} from '../hooks/use-alert.ts'
import {useNavigate, useSearchParams} from 'react-router-dom'
import {CurrentUserMe} from "../schemas/auth.ts";
import {ApiResponse, ThemeColor} from "../schemas/global.ts";
import {getAuthProviders, getCurrentUser} from "../services/auth-service.ts";
import useAuthStore from '../store/auth-store';
import FormAuthLogin from "../components/auth/login-form.tsx";
import FormAuthRegister from "../components/auth/register-form.tsx";
import {OAuthProviderButton} from "../components/auth/oauth-provider-button.tsx";

const AuthPage: React.FC = () => {
    const {t} = useTranslation()
    const alert = useAlert()
    const navigate = useNavigate()
	const [searchParams] = useSearchParams()
    const {setAuth} = useAuthStore()
    const [showPassword, setShowPassword] = useState<boolean>(false)

    const [isLogin, setIsLogin] = useState(true)
	const [googleEnabled, setGoogleEnabled] = useState(false)
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
    const theme = localStorage.getItem('theme') as ThemeColor || (isDarkMode ? ThemeColor.DARK : ThemeColor.LIGHT)


    useEffect(() => {
        (async () => {
            const res = await getCurrentUser()
            if (res.ok && res.result) {
                const {id, email, role} = res.result as CurrentUserMe
                setAuth({id, email, role})
                navigate('/', {replace: true})
            }
        })()
    }, [navigate, setAuth])

	useEffect(() => {
		getAuthProviders().then((response) => {
			if (response.ok && response.result && !Array.isArray(response.result)) {
				setGoogleEnabled(Boolean((response.result as {google: boolean}).google))
			}
		})
	}, [])

	useEffect(() => {
		const errorCode = searchParams.get('oauth_error')
		if (!errorCode) return
		const knownCodes = ['cancelled', 'invalid_state', 'provider', 'session']
		const translationCode = knownCodes.includes(errorCode) ? errorCode : 'provider'
		alert(t(`auth.oauthErrors.${translationCode}`), 'alert-error')
		navigate('/auth', {replace: true})
	}, [alert, navigate, searchParams, t])

    const toggleMode = () => setIsLogin(!isLogin)

    const handlerAuthErrors = (response: ApiResponse<unknown>) => {
        if (response.errors instanceof Array) {
            response.errors.forEach((error) => {
                alert(error, 'alert-error')
            })
        } else {
            const messageFormatted = (response.errors as string).slice(0, 1).toUpperCase() + (response.errors as string).slice(1)
            alert(messageFormatted, 'alert-error')
        }
    }

    const toggleVisibility = () => {
        setShowPassword(!showPassword);
    }

    const onLoginSuccess = () => {
        alert(t('auth.loginSuccess'), 'alert-success')
        navigate('/', {replace: true})
    }

    const onRegisterSuccess = (email: string) => {
        alert(t('auth.registerSuccess'), 'alert-success')
        setTimeout(() => {
            navigate('/pending-email-verification', {state: {email: email}});
        })
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-base-200 py-12" data-theme={theme}>
            <div className="w-full max-w-md p-8 space-y-4 bg-base-100 shadow-xl rounded-lg">
                <h2 className="text-2xl font-bold text-center">
                    {isLogin ? t('auth.loginTitle') : t('auth.registerTitle')}
                </h2>
                {isLogin ? (
                    <FormAuthLogin
                        showPassword={showPassword}
                        onLoginFailed={handlerAuthErrors}
                        onLoginSuccess={onLoginSuccess}
                        toggleVisibility={toggleVisibility}/>
                ) : (
                    <FormAuthRegister
                        showPassword={showPassword}
                        onRegisterSuccess={onRegisterSuccess}
                        toggleVisibility={toggleVisibility}
                        onRegisterFailed={handlerAuthErrors}/>
                )}
				{googleEnabled && (
					<>
						<div className="divider">{t('auth.or')}</div>
						<OAuthProviderButton mode={isLogin ? 'login' : 'register'}/>
					</>
				)}
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
