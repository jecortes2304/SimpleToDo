import React, {useCallback, useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {getProfile, updateProfile} from '../services/UserService'
import {useAlert} from '../hooks/useAlert'
import {UpdateUserRequestDto, User} from '../schemas/user'
import {EnvelopeIcon, PhoneIcon, PhotoIcon, UserCircleIcon, UserIcon} from "@heroicons/react/16/solid";
import useStore from "../store/store.ts";

const ProfilePage: React.FC = () => {
    const {t} = useTranslation()
    const alert = useAlert()
    const [user, setUser] = useState<User | null>(null)
    const {setAvatarRefresh} = useStore()
    const [form, setForm] = useState<UpdateUserRequestDto>({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        image: ''
    })

    const fetchProfileCallback = useCallback(async () => {
        const res = await getProfile()
        if (res.ok && res.result) {
            const data = res.result as User
            setUser(data)
            setForm({
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.phone,
                image: data.image || ''
            })
        } else {
            alert(t('profile.errorLoading'), 'alert-error')
        }
    }, [])

    useEffect(() => {
        fetchProfileCallback().then()
    }, [fetchProfileCallback])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target
        setForm((prev) => ({
            ...prev,
            [name]: value
        }))
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onloadend = () => {
            const base64String = (reader.result as string).split(',')[1] || ''
            setForm((prev) => ({...prev, image: base64String}))
        }
        reader.readAsDataURL(file)
    }

    const handleSubmit = async () => {
        const res = await updateProfile(form)
        if (res.ok) {
            alert(t('profile.updated'), 'alert-success')
            await fetchProfileCallback()
        } else {
            alert(t('profile.updateError'), 'alert-error')
        }
        setAvatarRefresh(true)
    }

    const renderAvatar = () => {
        if (form.image) {
            return <img src={`data:image/png;base64,${form.image}`} alt="avatar"/>
        }
        if (user?.image) {
            return <img src={`data:image/png;base64,${user.image}`} alt="avatar"/>
        }
        return <UserCircleIcon className="w-full text-gray-500"/>
    }

    return (
        <div className="max-w-3xl mx-auto p-6">
            <h2 className="text-2xl font-bold mb-6 text-center">{t('profile.title')}</h2>

            <div className="card bg-base-100 shadow-xl">
                <div className="card-body space-y-6 items-center">

                    <div className="avatar">
                        <div className="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                            {renderAvatar()}
                        </div>
                    </div>

                    <div className="form-control mx-auto w-full max-w-md">
                        <label className="input validator w-full">
                            <UserIcon className="h-[1em] opacity-50"/>
                            <input
                                placeholder={t('auth.firstNamePlaceholder')}
                                value={form.firstName}
                                onChange={handleChange}
                                type="text"
                                name="firstName"
                                required
                                minLength={4}
                                maxLength={15}
                                title={t('auth.firstNameHint')}/>
                        </label>
                    </div>

                    <div className="form-control mx-auto w-full max-w-md">
                        <label className="input validator w-full">
                            <UserIcon className="h-[1em] opacity-50"/>
                            <input
                                placeholder={t('auth.lastNamePlaceholder')}
                                value={form.lastName}
                                onChange={handleChange}
                                type="text"
                                name="lastName"
                                required
                                minLength={4}
                                maxLength={15}
                                title={t('auth.lastNameHint')}/>
                        </label>
                    </div>

                    <div className="form-control mx-auto w-full max-w-md">
                        <label className="input validator w-full">
                            <EnvelopeIcon className="h-[1em] opacity-50"/>
                            <input
                                placeholder={t('auth.emailPlaceholder')}
                                value={form.email}
                                onChange={handleChange}
                                type="email"
                                name="email"
                                required
                                minLength={4}
                                maxLength={15}
                                title={t('auth.emailHint')}/>
                        </label>
                    </div>

                    <div className="form-control mx-auto w-full max-w-md">
                        <label className="input validator w-full">
                            <PhoneIcon className="h-[1em] opacity-50"/>
                            <input
                                placeholder={t('auth.phonePlaceholder')}
                                value={form.phone}
                                onChange={handleChange}
                                type="tel"
                                name="phone"
                                required
                                minLength={4}
                                maxLength={15}
                                title={t('auth.phoneHint')}/>
                        </label>
                    </div>


                    <div className="form-control mx-auto w-full max-w-md justify-center items-center">
                        <label className="input validator w-full">
                            <PhotoIcon className="h-[1em] opacity-50"/>
                            <input
                                name="phone"
                                required
                                type="file"
                                className="file-input file-input-bordered mx-auto"
                                accept="image/*"
                                onChange={handleImageChange}/>
                        </label>
                    </div>


                    <div className="form-control mt-4 text-center">
                        <button className="btn btn-primary mx-auto" onClick={handleSubmit}>
                            {t('profile.save')}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    )

}

export default ProfilePage