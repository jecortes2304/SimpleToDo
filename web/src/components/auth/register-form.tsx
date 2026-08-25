import React, {SubmitEvent, useState} from "react";
import {EnvelopeIcon, EyeIcon, LockClosedIcon, UserCircleIcon, UserIcon} from "@heroicons/react/16/solid";
import {useTranslation} from "react-i18next";
import {useAlert} from "../../hooks/use-alert.ts";
import {RegisterDto} from "../../schemas/auth.ts";
import {ApiResponse} from "../../schemas/global.ts";
import {register} from "../../services/auth-service.ts";

interface FormAuthRegisterProps {
    onRegisterFailed: (response: ApiResponse<unknown>) => void;
    onRegisterSuccess: (email: string) => void;
    showPassword: boolean;
    toggleVisibility: (e: React.MouseEvent<SVGSVGElement>) => void;
}

const FormAuthRegister: React.FC<FormAuthRegisterProps> = ({onRegisterFailed, onRegisterSuccess, showPassword, toggleVisibility}) => {
    const {t} = useTranslation()

    const alert = useAlert()
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [username, setUsername] = useState<string>('')
    const [firstName, setFirstName] = useState<string>('')
    const [lastName, setLastName] = useState<string>('')


    const handleRegisterSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
        e.stopPropagation()
        e.preventDefault()

        setIsLoading(true);

        if (!email || !password || !username || !firstName || !lastName) {
            alert(t('auth.fieldsRequired'), 'alert-error')
            setIsLoading(false)
            return
        }

        const userToRegister: RegisterDto = {
            username: username,
            email: email,
            password: password,
            firstName: firstName,
            lastName: lastName,
        }

        const response = await register(userToRegister)
        if (response.ok && (response.statusCode === 201 || response.statusCode === 200)) {
            setIsLoading(false);
            onRegisterSuccess(email)
        } else {
            setIsLoading(false);
            onRegisterFailed(response as ApiResponse<unknown>)
        }
    }

    return (
        <div>
            <form className="space-y-2 flex flex-col items-center"
                  onSubmit={(e: SubmitEvent<HTMLFormElement>) => handleRegisterSubmit(e)}>

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

                <div className="my-5">
                    {isLoading ? (
                            <div className="justify-center flex mb-4">
                                <span className="loading loading-spinner loading-lg text-primary mb-4"/>
                            </div>
                        ) : (
                            <button type="submit" className="btn btn-primary mx-auto">
                                {t('auth.register')}
                            </button>
                        )
                    }
                </div>
            </form>
        </div>
    )
}

export default FormAuthRegister;
