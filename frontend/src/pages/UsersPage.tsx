import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {useAlert} from '../hooks/useAlert';
import {ApiResponse, Pagination as PaginationType, SortOrder} from '../schemas/globals';
import {deleteUser, getAllUsers, updateUser} from '../services/UserService';
import {UpdateUserRequestDto, UserResponseDto} from '../schemas/user';
import {MagnifyingGlassIcon, PencilSquareIcon, TrashIcon, UserCircleIcon} from '@heroicons/react/16/solid';
import PaginationComponent from '../components/PaginationComponent';
import Lottie from 'lottie-react';
import notFoundLottie from '../assets/lottie/not_found_lottie.json';

const UsersPage: React.FC = () => {
    const {t} = useTranslation();
    const alert = useAlert();

    const [rows, setRows] = useState<UserResponseDto[]>([]);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [sort, setSort] = useState<SortOrder>('asc');
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);

    const [editUser, setEditUser] = useState<UserResponseDto | null>(null);
    const [saving, setSaving] = useState(false);


    const fetchUsers = useCallback(async () => {
        const res: ApiResponse<PaginationType<UserResponseDto>> = await getAllUsers(limit, page, sort);
        if (res.ok && res.result) {
            const p = res.result as PaginationType<UserResponseDto>;
            setRows(p.items);
            setPage(p.page);
            setLimit(p.limit);
            setSort((p.sort?.toLowerCase() === 'desc' ? 'desc' : 'asc') as SortOrder);
            setTotalPages(p.totalPages);
            setTotalItems(p.totalItems);
        } else {
            alert((res.errors as string) ?? 'Error', 'alert-error');
        }
    }, [limit, page, sort]);

    useEffect(() => {
        fetchUsers().then();
    }, [fetchUsers]);

    const filtered = useMemo(() => {
        const needle = search.trim().toLowerCase();
        if (!needle) return rows;
        return rows.filter(r =>
            (r.firstName ?? '').toLowerCase().includes(needle) ||
            (r.lastName ?? '').toLowerCase().includes(needle) ||
            (r.email ?? '').toLowerCase().includes(needle) ||
            (r.username ?? '').toLowerCase().includes(needle)
        );
    }, [rows, search]);

    const toggleSelection = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const openEditModal = (u: UserResponseDto) => {
        setEditUser(u);
        (document.getElementById('modalEditUser') as HTMLDialogElement).showModal();
    };

    const closeEditModal = () => {
        setEditUser(null);
        (document.getElementById('modalEditUser') as HTMLDialogElement).close();
    };

    const onSaveUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editUser) return;
        setSaving(true);
        const dto: UpdateUserRequestDto = {
            firstName: editUser.firstName,
            lastName: editUser.lastName,
            email: editUser.email,
            phone: editUser.phone,
        };
        const res = await updateUser(editUser.id, dto);
        setSaving(false);
        if (res.ok) {
            alert(t('projects.updated'), 'alert-success');
            closeEditModal();
            fetchUsers().then();
        } else {
            alert(res.errors as string, 'alert-error');
        }
    };

    const onDelete = async (id: number) => {
        const res = await deleteUser(id);
        if (res.ok) {
            alert(t('projects.deleted'), 'alert-success'); // o users.deleted
            fetchUsers().then();
        } else {
            alert(res.errors as string, 'alert-error');
        }
    };

    const onDeleteSelected = async () => {
        await Promise.all(selectedIds.map(deleteUser));
        alert(t('projects.deletedMultiple'), 'alert-success'); // o users.deletedMultiple
        setSelectedIds([]);
        fetchUsers().then();
    };

    const renderAvatar = (user: UserResponseDto) => {
        if (user.image) {
            return <img src={`data:image/png;base64,${user.image}`} alt="avatar"/>
        }
        if (user?.image) {
            return <img src={`data:image/png;base64,${user.image}`} alt="avatar"/>
        }
        return <UserCircleIcon className="w-full text-gray-500"/>
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">{t('users.users')}</h1>

            <div className="flex gap-4 mb-4 flex-wrap items-center">
                <label className="input">
                    <MagnifyingGlassIcon className="h-5 w-5"/>
                    <input
                        type="search"
                        className="grow"
                        placeholder={t('projects.search') as string}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </label>

                {selectedIds.length > 0 && (
                    <button className="btn btn-error btn-sm" onClick={onDeleteSelected}>
                        <TrashIcon className="h-4 w-4 mr-1"/> ({selectedIds.length})
                    </button>
                )}
            </div>

            {/* Edit modal */}
            <dialog id="modalEditUser" className="modal">
                <div className="modal-box">
                    <h3 className="font-bold text-lg">{t('projects.update')}</h3>
                    {editUser && (
                        <form className="space-y-3 mt-3" onSubmit={onSaveUser}>
                            <input
                                className="input input-bordered w-full"
                                placeholder={t('profile.firstName') as string}
                                value={editUser.firstName ?? ''}
                                onChange={e => setEditUser(prev => prev ? {...prev, firstName: e.target.value} : prev)}
                            />
                            <input
                                className="input input-bordered w-full"
                                placeholder={t('profile.lastName') as string}
                                value={editUser.lastName ?? ''}
                                onChange={e => setEditUser(prev => prev ? {...prev, lastName: e.target.value} : prev)}
                            />
                            <input
                                className="input input-bordered w-full"
                                placeholder={t('profile.email') as string}
                                type="email"
                                value={editUser.email ?? ''}
                                onChange={e => setEditUser(prev => prev ? {...prev, email: e.target.value} : prev)}
                            />
                            <input
                                className="input input-bordered w-full"
                                placeholder={t('profile.phone') as string}
                                value={editUser.phone ?? ''}
                                onChange={e => setEditUser(prev => prev ? {...prev, phone: e.target.value} : prev)}
                            />
                            <div className="modal-action">
                                <button type="button" className="btn" onClick={closeEditModal}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving && <span className="loading loading-spinner mr-2"/>}
                                    Save
                                </button>
                            </div>
                        </form>
                    )}
                </div>
                <form method="dialog" className="modal-backdrop" onClick={closeEditModal}>
                    <button>close</button>
                </form>
            </dialog>

            <div className="overflow-x-auto">
                <table className="table">
                    <thead>
                    <tr>
                        <th></th>
                        <th></th>
                        <th>{t('profile.firstName')}</th>
                        <th>{t('profile.lastName')}</th>
                        <th>{t('profile.email')}</th>
                        <th>{t('profile.username')}</th>
                        <th>{t('profile.phone')}</th>
                        <th>{t('projects.actions')}</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filtered.length > 0 ? (
                        filtered.map((user, idx) => (
                            <tr key={user.id} className={idx % 2 === 0 ? 'bg-base-200' : ''}>
                                <td>
                                    <input
                                        disabled={user.role === 'Admin'}
                                        type="checkbox"
                                        checked={selectedIds.includes(user.id)}
                                        onChange={() => toggleSelection(user.id)}
                                        className="checkbox checkbox-sm"
                                    />
                                </td>
                                <td>
                                    <div className="avatar">
                                        <div
                                            className="w-10 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                                            {renderAvatar(user)}
                                        </div>
                                    </div>
                                </td>
                                <td>{user.firstName}</td>
                                <td>{user.lastName}</td>
                                <td>{user.email}</td>
                                <td>{user.username}</td>
                                <td>{user.phone}</td>
                                <td className="whitespace-nowrap">
                                    <button
                                        className={`btn btn-sm btn-outline btn-info mr-2 ${user.role === 'Admin' && 'btn-disabled'}`}
                                        onClick={() => openEditModal(user)}>
                                        <PencilSquareIcon className="h-4 w-4"/>
                                    </button>
                                    <button
                                        className={`btn btn-sm btn-outline btn-error ${user.role === 'Admin' && 'btn-disabled'}`}
                                        onClick={() => onDelete(user.id)}>
                                        <TrashIcon className="h-4 w-4"/>
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={7}>
                                <div className="flex justify-center items-center min-h-[200px]">
                                    <Lottie className="h-50 w-50" animationData={notFoundLottie} loop={true}/>
                                </div>
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>

            <PaginationComponent
                page={page}
                totalPages={totalPages}
                totalItems={totalItems}
                currentItems={filtered.length}
                onPageChange={setPage}
                maxVisiblePages={5}
                label={t('users.users')}
            />
        </div>
    );
};

export default UsersPage;
