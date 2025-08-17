import React, {useState} from 'react';
import {useAlert} from '../hooks/useAlert';
import {forgotPassword} from '../services/AuthService';
import {ThemeColor} from '../schemas/globals';
import {useNavigate} from "react-router-dom";

const ForgotPasswordPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const alert = useAlert();
    const [successfulSent, setSuccessfulSent] = useState(false);
    const navigate = useNavigate();
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
    const theme = localStorage.getItem('theme') as ThemeColor || (isDarkMode ? ThemeColor.DARK : ThemeColor.LIGHT)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        const res = await forgotPassword(email);
        setLoading(false);

        if (res.ok) {
            alert('If the email exists, a reset link has been sent', 'alert-success');
            setSuccessfulSent(true);
        } else {
            alert('Something went wrong', 'alert-error');
            console.error('Error sending reset link:', res);
            setSuccessfulSent(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-base-200" data-theme={theme}>
            <div className="card w-full max-w-md bg-base-100 shadow-xl p-6">
                <h2 className="text-2xl font-bold mb-4 text-center">Forgot Password</h2>
                {!successfulSent ? (<form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="email"
                        placeholder="Your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="input input-bordered w-full"
                        required
                    />
                    <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                        {loading && <span className="loading loading-spinner mr-2"/>}
                        Send reset link
                    </button>
                </form>) :
                    (<div className="text-center">
                        <p className="text-lg mb-4">If the email exists, a reset link has been sent to your email.</p>
                        <button
                            className="btn btn-primary w-full"
                            onClick={() => {
                                setSuccessfulSent(false);
                                setEmail('');
                                navigate('/auth', {replace: true});
                            }}
                        >
                            Go back to login
                        </button>
                    </div>)
                }
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
