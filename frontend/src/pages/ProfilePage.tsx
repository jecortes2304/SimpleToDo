import React, {useCallback, useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {getAISettings, getProfile, updateAISettings, updateProfile} from '../services/UserService'
import {useAlert} from '../hooks/useAlert'
import {AISettingsDto, UpdateAISettingsDto, UpdateUserRequestDto, User} from '../schemas/user'
import {
    CommandLineIcon,
    CpuChipIcon,
    EnvelopeIcon,
    GlobeAltIcon,
    KeyIcon,
    PhoneIcon,
    PhotoIcon,
    UserCircleIcon,
    UserIcon
} from "@heroicons/react/16/solid";
import useAppStore from "../store/appStore.ts";

const ProfilePage: React.FC = () => {
    const {t} = useTranslation()
    const alert = useAlert()
    const {setAvatarRefresh} = useAppStore()

    // User State
    const [user, setUser] = useState<User | null>(null)
    const [userForm, setUserForm] = useState<UpdateUserRequestDto>({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        image: ''
    })

    // AI Settings State
    const [aiForm, setAiForm] = useState<UpdateAISettingsDto>({
        baseUrl: '',
        apiKey: '',
        model: ''
    })

    const fetchData = useCallback(async () => {
        // Fetch User Profile
        const profileRes = await getProfile()
        if (profileRes.ok && profileRes.result) {
            const data = profileRes.result as User
            setUser(data)
            setUserForm({
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.phone,
                image: data.image || ''
            })
        } else {
            alert(t('profile.errorLoading'), 'alert-error')
        }

        // Fetch AI Settings
        const aiRes = await getAISettings()
        if (aiRes.ok && aiRes.result) {
            const response = aiRes.result as AISettingsDto;
            setAiForm({
                baseUrl: response.baseUrl,
                apiKey: response.apiKey,
                model: response.model
            })
        }
    }, [t])

    useEffect(() => {
        fetchData().then()
    }, [fetchData])

    // Handlers for User Form
    const handleUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target
        setUserForm((prev) => ({...prev, [name]: value}))
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onloadend = () => {
            const base64String = (reader.result as string).split(',')[1] || ''
            setUserForm((prev) => ({...prev, image: base64String}))
        }
        reader.readAsDataURL(file)
    }

    const handleUserSubmit = async () => {
        const res = await updateProfile(userForm)
        if (res.ok) {
            alert(t('profile.updated'), 'alert-success')
            setAvatarRefresh(true)
            await fetchData()
        } else {
            alert(t('profile.updateError'), 'alert-error')
        }
    }

    // Handlers for AI Form
    const handleAiChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const {name, value} = e.target
        setAiForm((prev) => ({...prev, [name]: value}))
    }

    const handleAiSubmit = async () => {
        const res = await updateAISettings(aiForm)
        if (res.ok) {
            alert(t('profile.aiSettingsUpdated'), 'alert-success')
        } else {
            alert(t('profile.aiSettingsError'), 'alert-error')
        }
    }

    const renderAvatar = () => {
        if (userForm.image) {
            return <img src={`data:image/png;base64,${userForm.image}`} alt="avatar" className="object-cover" />
        }
        if (user?.image) {
            return <img src={`data:image/png;base64,${user?.image}`} alt="avatar" className="object-cover" />
        }
        return <UserCircleIcon className="w-24 h-24 text-gray-500" />
    }

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8">
            <h2 className="text-3xl font-bold text-center mb-8">{t('profile.title')}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">

                {/* User Profile Card */}
                <div className="card bg-base-100 shadow-xl h-full flex flex-col">
                    <div className="card-body items-center text-center grow">
                        <h3 className="card-title text-xl mb-6">{t('profile.personalInfo')}</h3>

                        <div className="avatar mb-6">
                            <div className="w-32 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 shadow-lg">
                                {renderAvatar()}
                            </div>
                        </div>

                        <div className="space-y-4 w-full max-w-sm grow">
                            <div className="form-control w-full">
                                <label className="input validator w-full flex items-center gap-3 shadow-sm">
                                    <UserIcon className="h-5 w-5 opacity-70"/>
                                    <input
                                        placeholder={t('auth.firstNamePlaceholder')}
                                        value={userForm.firstName}
                                        onChange={handleUserChange}
                                        name="firstName"
                                        className="grow font-medium"
                                    />
                                </label>
                            </div>

                            <div className="form-control w-full">
                                <label className="input validator w-full flex items-center gap-3 shadow-sm">
                                    <UserIcon className="h-5 w-5 opacity-70"/>
                                    <input
                                        placeholder={t('auth.lastNamePlaceholder')}
                                        value={userForm.lastName}
                                        onChange={handleUserChange}
                                        name="lastName"
                                        className="grow font-medium"
                                    />
                                </label>
                            </div>

                            <div className="form-control w-full">
                                <label className="input validator w-full flex items-center gap-3 shadow-sm">
                                    <EnvelopeIcon className="h-5 w-5 opacity-70"/>
                                    <input
                                        placeholder={t('auth.emailPlaceholder')}
                                        value={userForm.email}
                                        onChange={handleUserChange}
                                        name="email"
                                        className="grow font-medium"
                                    />
                                </label>
                            </div>

                            <div className="form-control w-full">
                                <label className="input validator w-full flex items-center gap-3 shadow-sm">
                                    <PhoneIcon className="h-5 w-5 opacity-70"/>
                                    <input
                                        placeholder={t('auth.phonePlaceholder')}
                                        value={userForm.phone}
                                        onChange={handleUserChange}
                                        name="phone"
                                        className="grow font-medium"
                                    />
                                </label>
                            </div>

                            <div className="form-control w-full">
                                <label className="input validator w-full flex items-center gap-3 cursor-pointer shadow-sm">
                                    <PhotoIcon className="h-5 w-5 opacity-70"/>
                                    <input
                                        type="file"
                                        className="file-input file-input-ghost file-input-sm w-full max-w-xs p-0 text-sm"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="w-full max-w-sm mt-8">
                            <button className="btn btn-primary w-full shadow-md" onClick={handleUserSubmit}>
                                {t('profile.save')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* AI Settings Card */}
                <div className="card bg-base-100 shadow-xl h-full flex flex-col">
                    <div className="card-body items-center text-center grow">
                        <h3 className="card-title text-xl mb-2 flex items-center gap-2">
                            <CpuChipIcon className="h-6 w-6 text-secondary"/>
                            {t('profile.aiSettingsTitle')}
                        </h3>
                        <p className="text-sm text-gray-500 mb-8 px-4">{t('profile.aiSettingsDesc')}</p>

                        <div className="space-y-6 w-full max-w-sm grow flex flex-col justify-center">
                            <div className="form-control w-full">
                                <div className="label pt-0 pb-1">
                                    <span className="label-text font-semibold text-xs uppercase tracking-wider opacity-70 ml-1">{t('profile.aiBaseUrl')}</span>
                                </div>
                                <label className="input validator w-full flex items-center gap-3 shadow-sm bg-base-200/50 border-base-300">
                                    <GlobeAltIcon className="h-5 w-5 opacity-70"/>
                                    <input
                                        type="url"
                                        placeholder="https://api.openai.com/v1"
                                        value={aiForm.baseUrl}
                                        onChange={handleAiChange}
                                        name="baseUrl"
                                        className="grow font-mono text-sm"
                                    />
                                </label>
                            </div>

                            <div className="form-control w-full">
                                <div className="label pt-0 pb-1">
                                    <span className="label-text font-semibold text-xs uppercase tracking-wider opacity-70 ml-1">{t('profile.aiApiKey')}</span>
                                </div>
                                <label className="input validator w-full flex items-center gap-3 shadow-sm bg-base-200/50 border-base-300">
                                    <KeyIcon className="h-5 w-5 opacity-70"/>
                                    <input
                                        type="password"
                                        placeholder="sk-..."
                                        value={aiForm.apiKey}
                                        onChange={handleAiChange}
                                        name="apiKey"
                                        className="grow font-mono text-sm"
                                    />
                                </label>
                            </div>

                            <div className="form-control w-full">
                                <div className="label pt-0 pb-1">
                                    <span className="label-text font-semibold text-xs uppercase tracking-wider opacity-70 ml-1">{t('profile.aiModel')}</span>
                                </div>
                                <label className="input validator w-full flex items-center gap-3 shadow-sm bg-base-200/50 border-base-300">
                                    <CommandLineIcon className="h-5 w-5 opacity-70"/>
                                    <input
                                        type="text"
                                        placeholder="gpt-4o"
                                        value={aiForm.model}
                                        onChange={handleAiChange}
                                        name="model"
                                        className="grow font-mono text-sm"
                                        list="ai-models"
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="w-full max-w-sm mt-8">
                            <button className="btn btn-secondary w-full shadow-md" onClick={handleAiSubmit}>
                                {t('profile.saveAiSettings')}
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}

export default ProfilePage