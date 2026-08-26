import {useMemo} from 'react';
import {useTranslation} from 'react-i18next';
import {PencilSquareIcon, TrashIcon, UserCircleIcon} from '@heroicons/react/16/solid';
import {UserResponseDto} from '../../schemas/user.ts';
import {defineColumns, SharedTable} from '../shared/table';

type UsersTableProps = {
    users: readonly UserResponseDto[];
    selectedIds: readonly number[];
    onToggleSelection: (id: number) => void;
    onEdit: (user: UserResponseDto) => void;
    onRequestDelete: (user: UserResponseDto) => void;
    isLoading?: boolean;
};

const isAdmin = (user: UserResponseDto) => user.role?.toLocaleLowerCase() === 'admin';

function UsersTable({
    users,
    selectedIds,
    onToggleSelection,
    onEdit,
    onRequestDelete,
    isLoading = false,
}: UsersTableProps) {
    const {t} = useTranslation();
    const columns = useMemo(() => defineColumns<UserResponseDto>()([
        {
            id: 'selection',
            label: <span className="sr-only">{t('users.select')}</span>,
            render: user => (
                <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    disabled={isAdmin(user)}
                    checked={selectedIds.includes(user.id)}
                    aria-label={t('users.selectUser', {username: user.username})}
                    onChange={() => onToggleSelection(user.id)}
                />
            ),
            headerClassName: 'w-12',
            cellClassName: 'w-12',
        },
        {id: 'id', label: 'ID', accessorKey: 'id', cellClassName: 'font-mono text-xs'},
        {
            id: 'avatar',
            label: <span className="sr-only">{t('users.avatar')}</span>,
            render: user => (
                <div className="avatar">
                    <div className="w-10 rounded-full ring ring-primary ring-offset-2 ring-offset-base-100">
                        {user.image
                            ? <img src={`data:image/png;base64,${user.image}`} alt={t('users.userAvatar', {username: user.username})}/>
                            : <UserCircleIcon className="w-full text-base-content/50"/>}
                    </div>
                </div>
            ),
        },
        {id: 'firstName', label: t('profile.firstName'), accessorKey: 'firstName', cellClassName: 'font-semibold'},
        {id: 'lastName', label: t('profile.lastName'), accessorKey: 'lastName'},
        {id: 'email', label: t('profile.email'), accessorKey: 'email'},
        {id: 'username', label: t('profile.username'), accessorKey: 'username'},
        {id: 'role', label: t('users.role'), accessorKey: 'role'},
        {
            id: 'actions',
            label: t('projects.actions'),
            render: user => (
                <div className="flex gap-2 whitespace-nowrap">
                    <button
                        type="button"
                        className="btn btn-sm btn-outline btn-info"
                        disabled={isAdmin(user)}
                        title={t('users.edit')}
                        aria-label={t('users.editUser', {username: user.username})}
                        onClick={() => onEdit(user)}
                    >
                        <PencilSquareIcon className="h-4 w-4"/>
                    </button>
                    <button
                        type="button"
                        className="btn btn-sm btn-outline btn-error"
                        disabled={isAdmin(user)}
                        title={t('users.delete')}
                        aria-label={t('users.deleteUser', {username: user.username})}
                        onClick={() => onRequestDelete(user)}
                    >
                        <TrashIcon className="h-4 w-4"/>
                    </button>
                </div>
            ),
        },
    ]), [onEdit, onRequestDelete, onToggleSelection, selectedIds, t]);

    return (
        <div className="overflow-x-auto rounded-box border border-base-300">
            <SharedTable
                columns={columns}
                rows={users}
                getRowKey={user => user.id}
                isLoading={isLoading}
            />
        </div>
    );
}

export default UsersTable;
