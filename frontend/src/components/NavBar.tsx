import React, {useEffect, useState} from 'react';
import ThemeSwitcher from './ThemeSwitcher.tsx';
import LanguageSwitcher from './LanguageSwitcher.tsx';
import {useNavigate} from 'react-router-dom';
import {useAlert} from '../hooks/useAlert.ts';
import {logout} from '../services/AuthService.ts';
import {getProfile} from '../services/UserService.ts';
import {User} from '../schemas/user.ts';
import {useTranslation} from "react-i18next";
import {UserCircleIcon} from "@heroicons/react/16/solid";
import useStore from "../store/store.ts";

const NavBar: React.FC = () => {
    const navigate = useNavigate();
    const {t} = useTranslation();
    const alert = useAlert();
    const [user, setUser] = useState<User | null>(null);
    const {avatarRefresh} = useStore()

    const logoutCallback = async () => {
        const response = await logout();
        if (response.ok) {
            alert('Logged out successfully', 'alert-success');
            setTimeout(() => {
                localStorage.removeItem('token');
                navigate('/auth', {replace: true});
            }, 500);
        } else {
            alert('Error during logout', 'alert-error');
        }
    };

    useEffect(() => {
        const fetchProfile = async () => {
            const res = await getProfile();
            if (res.ok && res.result) {
                const userResponse = res.result as User;
                setUser(userResponse);
            }
        };
        fetchProfile().then();
    }, [avatarRefresh]);

    return (
        <div className="navbar bg-base-100 shadow-sm flex">
            <div className="flex-2">
                <label htmlFor="my-drawer" className="btn btn-circle ms-5 text-xl drawer-button lg:hidden">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                         className="inline-block h-5 w-5 stroke-current">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                              d="M4 6h16M4 12h16M4 18h16"></path>
                    </svg>
                </label>
            </div>
            <div className="flex gap-4">
                <ThemeSwitcher/>
                <LanguageSwitcher/>
                <div className="dropdown dropdown-end me-5">
                    <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
                        <div className="w-10 rounded-full">
                            {user?.image ? (
                                    <img
                                        alt="User avatar"
                                        src={`data:image/jpeg;base64,${user.image}`}
                                    />
                                ) :
                                <UserCircleIcon className="w-full text-gray-500"/>}
                        </div>
                    </div>

                    <ul tabIndex={0}
                        className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow">
                        <li><a className="justify-between" href="/profile">{t('profile.profile')}</a></li>
                        <li>
                            <button onClick={logoutCallback}>{t('profile.logout')}</button>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default NavBar;
