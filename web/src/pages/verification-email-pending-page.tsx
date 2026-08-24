import React, {useState} from 'react';
import {useLocation, useNavigate, useSearchParams} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {resendVerification} from '../services/auth-service';
import {ThemeColor} from "../schemas/global.ts";

const VerificationEmailPendingPage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation() as { state?: { email?: string } };
	const [searchParams] = useSearchParams();
    const initialEmail = location.state?.email ?? '';
    const [email, setEmail] = useState(initialEmail);
    const [sending, setSending] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);
	const fromGoogle = searchParams.get('source') === 'google';
	const emailDeliveryFailed = searchParams.get('email_delivery') === 'failed';
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
    const theme = localStorage.getItem('theme') as ThemeColor || (isDarkMode ? ThemeColor.DARK : ThemeColor.LIGHT)


    const onResend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        setSending(true);
        const res = await resendVerification(email);
        setSending(false);
        setMsg(res.ok ? t('verifyEmail.resentOk') : (res.errors?.[0] ?? t('verifyEmail.resentError')));
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-base-200 p-6" data-theme={theme}>
            <div className="card w-full max-w-md bg-base-100 shadow-xl p-6 text-center">
                <div className="text-primary text-6xl mb-4">📬</div>
                <h1 className="text-2xl font-bold mb-2">{t('verifyEmailPending.title')}</h1>
                <p className="mb-4">
                    {email
                        ? t('verifyEmailPending.sentToEmail', { email })
                        : t('verifyEmailPending.sentGeneric')}
                </p>
                <p className="text-sm opacity-70 mb-4">{t('verifyEmailPending.tips')}</p>
				<p className="text-sm text-warning mb-4">{t('verifyEmailPending.deletionWarning')}</p>
				{fromGoogle && <div className="alert alert-info mb-4">{t('verifyEmailPending.googleAccount')}</div>}
				{emailDeliveryFailed && <div className="alert alert-warning mb-4">{t('verifyEmailPending.deliveryFailed')}</div>}

                <form className="space-y-3" onSubmit={onResend}>
                    {!email && (
                        <input
                            type="email"
                            className="input input-bordered w-full"
                            placeholder={t('verifyEmail.emailPlaceholder') as string}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    )}
                    <button className="btn btn-primary w-full" type="submit" disabled={sending}>
                        {sending && <span className="loading loading-spinner mr-2" />}
                        {t('verifyEmail.resend')}
                    </button>
                </form>

                {msg && <div className="alert alert-info mt-4">{msg}</div>}

                <div className="divider" />
                <button className="btn btn-soft" onClick={() => navigate('/auth')}>
                    {t('verifyEmail.goLogin')}
                </button>
            </div>
        </div>
    );
};

export default VerificationEmailPendingPage;
