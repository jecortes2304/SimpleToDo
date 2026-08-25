import {FormEvent, useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {PhotoIcon, UserCircleIcon} from '@heroicons/react/24/outline';
import {AdminUpdateUserRequestDto, UserResponseDto} from '../../schemas/user.ts';

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

type EditUserModalProps = {
    user: UserResponseDto | null;
    saving: boolean;
    onClose: () => void;
    onSubmit: (data: AdminUpdateUserRequestDto) => Promise<void>;
};

function EditUserModal({user, saving, onClose, onSubmit}: EditUserModalProps) {
    const {t} = useTranslation();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [newImage, setNewImage] = useState<string>();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [formError, setFormError] = useState('');

    useEffect(() => {
        setFirstName(user?.firstName ?? '');
        setLastName(user?.lastName ?? '');
        setNewImage(undefined);
        setPassword('');
        setConfirmPassword('');
        setFormError('');
    }, [user]);

    const handleImageChange = (file?: File) => {
        setFormError('');
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setFormError(t('users.invalidImage'));
            return;
        }
        if (file.size > MAX_AVATAR_BYTES) {
            setFormError(t('users.imageTooLarge'));
            return;
        }
        const reader = new FileReader();
        reader.onload = () => setNewImage(String(reader.result).split(',')[1] ?? '');
        reader.onerror = () => setFormError(t('users.invalidImage'));
        reader.readAsDataURL(file);
    };

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        if (password !== confirmPassword) {
            setFormError(t('users.passwordMismatch'));
            return;
        }
        setFormError('');
        await onSubmit({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            ...(newImage ? {image: newImage} : {}),
            ...(password ? {password} : {}),
        });
    };

    const avatar = newImage ?? user?.image;

    return (
        <dialog id="modalEditUser" className="modal">
            <div className="modal-box">
                <h2 className="text-lg font-bold">{t('users.editUser', {username: user?.username})}</h2>
                {user && (
                    <form className="mt-4 space-y-4" onSubmit={submit}>
                        <div className="flex items-center gap-4 rounded-box bg-base-200 p-3">
                            <div className="avatar">
                                <div className="h-16 w-16 overflow-hidden rounded-full bg-base-300">
                                    {avatar
                                        ? <img src={`data:image/png;base64,${avatar}`} alt={t('users.userAvatar', {username: user.username})}/>
                                        : <UserCircleIcon className="h-full w-full opacity-50"/>}
                                </div>
                            </div>
                            <label className="btn btn-outline btn-sm">
                                <PhotoIcon className="h-4 w-4"/>
                                {t('users.changeImage')}
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="sr-only"
                                    onChange={event => handleImageChange(event.target.files?.[0])}
                                />
                            </label>
                        </div>
                        <input
                            className="input input-bordered w-full"
                            aria-label={t('profile.firstName')}
                            placeholder={t('profile.firstName')}
                            minLength={2}
                            maxLength={50}
                            value={firstName}
                            onChange={event => setFirstName(event.target.value)}
                        />
                        <input
                            className="input input-bordered w-full"
                            aria-label={t('profile.lastName')}
                            placeholder={t('profile.lastName')}
                            minLength={2}
                            maxLength={50}
                            value={lastName}
                            onChange={event => setLastName(event.target.value)}
                        />
                        <div className="divider text-xs uppercase opacity-60">{t('users.resetPassword')}</div>
                        <input
                            className="input input-bordered w-full"
                            aria-label={t('users.newPassword')}
                            placeholder={t('users.newPasswordOptional')}
                            type="password"
                            autoComplete="new-password"
                            minLength={password ? 8 : undefined}
                            maxLength={72}
                            value={password}
                            onChange={event => setPassword(event.target.value)}
                        />
                        <input
                            className="input input-bordered w-full"
                            aria-label={t('users.confirmPassword')}
                            placeholder={t('users.confirmPassword')}
                            type="password"
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={event => setConfirmPassword(event.target.value)}
                        />
                        {formError && <p className="text-sm text-error" role="alert">{formError}</p>}
                        <div className="modal-action">
                            <button type="button" className="btn" disabled={saving} onClick={onClose}>
                                {t('common.cancel')}
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                {saving && <span className="loading loading-spinner loading-sm"/>}
                                {t('common.save')}
                            </button>
                        </div>
                    </form>
                )}
            </div>
            <form method="dialog" className="modal-backdrop" onSubmit={onClose}>
                <button>{t('common.close')}</button>
            </form>
        </dialog>
    );
}

export default EditUserModal;
