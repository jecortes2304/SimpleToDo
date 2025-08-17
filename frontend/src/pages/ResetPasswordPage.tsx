import React, {useCallback, useEffect, useState} from 'react';
import {useNavigate, useSearchParams} from 'react-router-dom';
import {resetPassword} from '../services/AuthService';
import {useTranslation} from 'react-i18next';
import {ApiResponse, ThemeColor} from '../schemas/globals';
import {useAlert} from '../hooks/useAlert';

const ResetPasswordPage: React.FC = () => {
    const { t } = useTranslation();
    const [status, setStatus] = useState<'form' | 'loading' | 'success' | 'error'>('form');
    const [message, setMessage] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const alert = useAlert();
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = localStorage.getItem('theme') as ThemeColor || (isDarkMode ? ThemeColor.DARK : ThemeColor.LIGHT);

    const token = searchParams.get('token');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage(t('resetPassword.tokenMissing'));
            alert(t('resetPassword.tokenMissing'), 'alert-error');
        }
    }, [token, t, alert]);

    const onSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            alert(t('resetPassword.passwordMismatch'), 'alert-error');
            return;
        }

        setStatus('loading');
        const res: ApiResponse<null> = await resetPassword(token!, newPassword);
        if (res.ok) {
            setStatus('success');
            setMessage(t('resetPassword.success'));
            alert(t('resetPassword.success'), 'alert-success');
        } else {
            setStatus('error');
            if (res.errors instanceof Array) {
                setMessage(res.errors[0]);
                alert(res.errors[0], 'alert-error');
            } else {
                setMessage(res.errors as string);
                alert(res.errors as string, 'alert-error');
            }
        }
    }, [newPassword, confirmPassword, token, t, alert]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-base-200 p-6" data-theme={theme}>
            <div className="card w-full max-w-md bg-base-100 shadow-xl p-6 text-center">
                {status === 'form' && (
                    <>
                        <h2 className="text-xl font-bold mb-4">{t('resetPassword.title')}</h2>
                        <form className="space-y-3" onSubmit={onSubmit}>
                            <input
                                type="password"
                                className="input input-bordered w-full"
                                placeholder={t('resetPassword.newPasswordPlaceholder') as string}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                            <input
                                type="password"
                                className="input input-bordered w-full"
                                placeholder={t('resetPassword.confirmPasswordPlaceholder') as string}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                            <button className="btn btn-primary w-full" type="submit">
                                {t('resetPassword.submit')}
                            </button>
                        </form>
                    </>
                )}

                {status === 'loading' && (
                    <>
                        <span className="loading loading-spinner loading-lg text-primary mb-4" />
                        <h2 className="text-lg font-bold">{t('resetPassword.updating')}</h2>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="text-success text-6xl mb-4">✅</div>
                        <h2 className="text-xl font-bold mb-2">{message}</h2>
                        <button className="btn btn-primary mt-4" onClick={() => navigate('/auth')}>
                            {t('resetPassword.goLogin')}
                        </button>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="text-error text-6xl mb-4">❌</div>
                        <h2 className="text-xl font-bold mb-2">{message}</h2>
                        <button className="btn btn-soft mt-4" onClick={() => navigate('/auth')}>
                            {t('resetPassword.goLogin')}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default ResetPasswordPage;
