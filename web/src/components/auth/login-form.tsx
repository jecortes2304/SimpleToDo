import React, {SubmitEvent, useState} from "react";
import {
    EnvelopeIcon, EyeIcon,
    LockClosedIcon,
} from "@heroicons/react/16/solid";
import {getCurrentUser, login} from "../../services/auth-service.ts";
import {CurrentUserMe} from "../../schemas/auth.ts";
import {useTranslation} from "react-i18next";
import {useAlert} from "../../hooks/use-alert.ts";
import {useNavigate} from "react-router-dom";
import useAuthStore from "../../store/auth-store.ts";
import {ApiResponse} from "../../schemas/global.ts";

interface FormAuthLoginProps {
    onLoginFailed: (response: ApiResponse<unknown>) => void;
    onLoginSuccess: () => void;
    showPassword: boolean;
    toggleVisibility: (e: React.MouseEvent<SVGSVGElement>) => void;
}

const FormAuthLogin: React.FC<FormAuthLoginProps> = ({onLoginFailed, onLoginSuccess, showPassword, toggleVisibility}) => {

    const {t} = useTranslation()
    const alert = useAlert()
    const navigate = useNavigate()
    const {setAuth} = useAuthStore()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleLoginSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
        e.stopPropagation()
        e.preventDefault()

        setIsLoading(true);

        if (!email || !password) {
            alert(t('auth.fieldsRequired'), 'alert-error')
            setIsLoading(false)
            return
        }

        const response = await login({email, password})
        if (response.ok && response.statusCode === 200) {
            setIsLoading(false);
            const me = await getCurrentUser()
            if (me.ok && me.result) {
                const {id, email: userEmail, role} = me.result as CurrentUserMe
                setAuth({id, email: userEmail, role})
            }
            onLoginSuccess()
        } else {
            setIsLoading(false);
            onLoginFailed(response as ApiResponse<unknown>)
        }
    }

    return (
        <div>
            <form className="space-y-2 flex flex-col items-center"
                  onSubmit={(e: SubmitEvent<HTMLFormElement>) => handleLoginSubmit(e)}>

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
                            id={"password"}
                            placeholder={t('auth.passwordPlaceholder')}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            type={showPassword ? 'text' : 'password'}
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

                <div className="text-right w-full">
                    <button
                        type="button"
                        className="link link-primary text-sm"
                        onClick={() => navigate('/forgot-password')}
                    >
                        {t('auth.forgotPassword')}
                    </button>
                </div>

                <div className="my-5">
                    {isLoading ? (
                            <div className="justify-center flex mt-4">
                                <span className="loading loading-spinner loading-lg text-primary mb-4"/>
                            </div>
                        ) : (
                            <button type="submit" className="btn btn-primary mx-auto">
                                {t('auth.login')}
                            </button>
                        )
                    }
                </div>
            </form>
        </div>
    )
}

export default FormAuthLogin;
