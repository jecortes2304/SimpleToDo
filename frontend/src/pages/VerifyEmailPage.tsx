import React, {useCallback, useEffect, useState} from 'react';
import {useNavigate, useSearchParams} from 'react-router-dom';
import {resendVerification, verifyEmail} from "../services/AuthService";
import {useTranslation} from "react-i18next";
import {ApiResponse, ThemeColor} from "../schemas/globals.ts";
import {useAlert} from "../hooks/useAlert.ts";

const VerifyEmailPage: React.FC = () => {
    const { t } = useTranslation();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');
    const [email, setEmail] = useState('');
    const [resending, setResending] = useState(false);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
    const theme = localStorage.getItem('theme') as ThemeColor || (isDarkMode ? ThemeColor.DARK : ThemeColor.LIGHT)
    const alert = useAlert()

    const handlerResendErrors = (response: ApiResponse<any>) => {
        if (response.errors instanceof Array) {
            response.errors.forEach((error) => {
                alert(error, 'alert-error')
            })
            setMessage(response.errors[0]);
        } else {
            const messageFormatted = (response.errors as string).slice(0, 1).toUpperCase() + (response.errors as string).slice(1)
            alert(messageFormatted, 'alert-error')
            setMessage(messageFormatted);
        }
    }

    const verifyEmailCallback = useCallback(async (token: string) => {
        const response = await verifyEmail(token);
        if (response.ok) {
            console.log(response.errors);
            setStatus('success');
            setMessage(t('verifyEmail.success'));
            alert(t('verifyEmail.success'), 'alert-success')
        } else {
            setStatus('error');
            handlerResendErrors(response);
        }
    }, [t]);

    useEffect(() => {
        const token = searchParams.get('token');
        if (!token) {
            setStatus('error');
            setMessage(t('verifyEmail.tokenMissing'));
            alert(t('verifyEmail.tokenMissing'), 'alert-error');
            return;
        }
        verifyEmailCallback(token).then();
    }, [searchParams, verifyEmailCallback, t]);

    const onResend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        setResending(true);
        const res = await resendVerification(email);
        setResending(false);
        if (res.ok) {
            setMessage(t('verifyEmail.resentOk'));
            alert(t('verifyEmail.resentOk'), 'alert-success');
        } else {
            handlerResendErrors(res);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-base-200 p-6" data-theme={theme}>
            <div className="card w-full max-w-md bg-base-100 shadow-xl p-6 text-center">
                {status === 'loading' && (
                    <>
                        <span className="loading loading-spinner loading-lg text-primary mb-4" />
                        <h2 className="text-lg font-bold">{t('verifyEmail.verifying')}</h2>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="text-success text-6xl mb-4">✅</div>
                        <h2 className="text-xl font-bold mb-2">{message}</h2>
                        <button
                            className="btn btn-primary mt-4"
                            onClick={() => navigate('/auth')}
                        >
                            {t('verifyEmail.goLogin')}
                        </button>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="text-error text-6xl mb-4">❌</div>
                        <h2 className="text-xl font-bold mb-2">{message}</h2>

                        <form className="mt-4 space-y-3" onSubmit={onResend}>
                            <input
                                type="email"
                                className="input input-bordered w-full"
                                placeholder={t('verifyEmail.emailPlaceholder') as string}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <button className="btn btn-primary w-full" type="submit" disabled={resending}>
                                {resending && <span className="loading loading-spinner mr-2" />}
                                {t('verifyEmail.resend')}
                            </button>
                        </form>

                        <button
                            className="btn btn-soft mt-4"
                            onClick={() => navigate('/auth')}
                        >
                            {t('verifyEmail.goLogin')}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default VerifyEmailPage;
