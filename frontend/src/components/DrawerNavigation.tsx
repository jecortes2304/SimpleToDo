import React, {useCallback, useEffect, useState} from "react";
import NavBar from "./NavBar";
import {useTranslation} from "react-i18next";
import {Outlet} from "react-router-dom";
import {AlertManager} from "./AlertManager.tsx";
import {ClipboardIcon, FolderIcon, HomeIcon} from "@heroicons/react/24/solid";
import {getProfile} from "../services/UserService.ts";
import {User} from "../schemas/user.ts";
import {useAlert} from "../hooks/useAlert.ts";
import {UsersIcon} from "@heroicons/react/16/solid";

const DrawerNavigation: React.FC = () => {
    const { t } = useTranslation();
    const [user, setUser] = useState<User | null>(null)
    const alert = useAlert()

    const fetchProfileCallback = useCallback(async () => {
        const res = await getProfile()
        if (res.ok && res.result) {
            const data = res.result as User
            setUser(data)
        } else {
            alert(t('profile.errorLoading'), 'alert-error')
        }
    }, [])

    useEffect(() => {
        fetchProfileCallback().then()
    }, [fetchProfileCallback])


    return (
        <div className="drawer lg:drawer-open h-full">
            <input id="my-drawer" type="checkbox" className="drawer-toggle" />
            <div className="drawer-content flex flex-col">
                <NavBar />
                <div className="flex-1 p-6">
                    <AlertManager />
                    <Outlet />
                </div>
            </div>
            <div className="drawer-side lg:max-h-[calc(100vh-3.2rem)]">
                <label htmlFor="my-drawer" className="drawer-overlay lg:hidden"></label>
                <ul className="menu bg-base-200 text-base-content min-h-full w-80 p-4 gap-4">
                    <div className="flex flex-col w-full items-center mb-8">
                        <div className="avatar mt-8 ">
                            <div className="w-20 rounded-2xl ring ring-primary ring-offset-base-100 ring-offset-2">
                                <img
                                    src="/logo.svg"
                                    alt="User Avatar"
                                />
                            </div>
                        </div>
                        <span className="mt-8 font-bold text-lg">SimpleToDo</span>
                    </div>

                    <li className="text-lg">
                        <a href="/" className="flex items-center gap-2">
                            <HomeIcon className="h-5 w-5" />
                            {t('dashboard.dashboard')}
                        </a>
                    </li>

                    <li className="text-lg">
                        <a href="/tasks" className="flex items-center gap-2">
                            <ClipboardIcon className="h-5 w-5" />
                            {t('tasks.tasks')}
                        </a>
                    </li>

                    <li className="text-lg">
                        <a href="/projects" className="flex items-center gap-2">
                            <FolderIcon className="h-5 w-5" />
                            {t('projects.projects')}
                        </a>
                    </li>

                    {user && user?.role === "Admin" && (
                        <li className="text-lg">
                            <a href="/users" className="flex items-center gap-2">
                                <UsersIcon className="h-5 w-5" />
                                {t('users.users')}
                            </a>
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default DrawerNavigation;