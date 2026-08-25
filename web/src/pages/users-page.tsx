import React, {useCallback, useEffect, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {TrashIcon} from '@heroicons/react/16/solid';
import {deleteUser, getAllUsers, updateUser} from '../services/user-service';
import {AdminUpdateUserRequestDto, UserResponseDto} from '../schemas/user';
import {Pagination} from '../schemas/global';
import {useAlert} from '../hooks/use-alert.ts';
import {useServerTableQuery} from '../hooks/use-server-table-query.ts';
import UsersTable from '../components/users/users-table.tsx';
import EditUserModal from '../components/users/edit-user-modal.tsx';
import ConfirmDialog from '../components/shared/confirm-dialog.tsx';
import {TablePageSize, TablePagination, TableSearchInput, TableSort, TableToolbar} from '../components/shared/table';

type DeleteRequest = {ids: number[]; username?: string};

const UsersPage: React.FC = () => {
    const {t} = useTranslation();
    const alert = useAlert();
    const {query, searchInput, setSearchInput, setPage, setLimit, setSort} = useServerTableQuery(10);

    const [users, setUsers] = useState<UserResponseDto[]>([]);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [editUser, setEditUser] = useState<UserResponseDto | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleteRequest, setDeleteRequest] = useState<DeleteRequest | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const latestRequestId = useRef(0);

    const fetchUsers = useCallback(async () => {
        const requestId = ++latestRequestId.current;
        setIsLoading(true);
        const response = await getAllUsers(query.limit, query.page, query.sort, query.search);
        if (requestId !== latestRequestId.current) return;

        if (response.ok && response.result) {
            const paginated = response.result as Pagination<UserResponseDto>;
            setUsers(paginated.items);
            setTotalPages(paginated.totalPages);
            setTotalItems(paginated.totalItems);
            setSelectedIds(previous => previous.filter(id => paginated.items.some(user => user.id === id)));
        } else {
            alert((response.errors as string) ?? 'Error', 'alert-error');
        }
        setIsLoading(false);
    }, [alert, query]);

    useEffect(() => {
        fetchUsers().then();
    }, [fetchUsers]);

    const toggleSelection = useCallback((id: number) => {
        setSelectedIds(previous => previous.includes(id) ? previous.filter(item => item !== id) : [...previous, id]);
    }, []);

    const openEditModal = useCallback((user: UserResponseDto) => {
        setEditUser(user);
        (document.getElementById('modalEditUser') as HTMLDialogElement).showModal();
    }, []);

    const closeEditModal = () => {
        setEditUser(null);
        (document.getElementById('modalEditUser') as HTMLDialogElement).close();
    };

    const saveUser = async (data: AdminUpdateUserRequestDto) => {
        if (!editUser) return;

        setSaving(true);
        const response = await updateUser(editUser.id, data);
        setSaving(false);

        if (response.ok) {
            alert(t('users.updated'), 'alert-success');
            closeEditModal();
            await fetchUsers();
        } else {
            alert(response.errors as string, 'alert-error');
        }
    };

    const requestSingleDelete = useCallback((user: UserResponseDto) => {
        setDeleteRequest({ids: [user.id], username: user.username});
    }, []);

    const confirmDelete = async () => {
        if (!deleteRequest?.ids.length) return;
        setIsDeleting(true);
        const responses = await Promise.all(deleteRequest.ids.map(deleteUser));
        const failed = responses.find(response => !response.ok);

        if (failed) {
            alert(failed.errors as string, 'alert-error');
        } else {
            alert(deleteRequest.ids.length === 1 ? t('users.deleted') : t('users.deletedMultiple'), 'alert-success');
            setSelectedIds(previous => previous.filter(id => !deleteRequest.ids.includes(id)));
            setDeleteRequest(null);
            await fetchUsers();
        }
        setIsDeleting(false);
    };

    const deleteMessage = deleteRequest?.ids.length === 1
        ? t('users.confirmDeleteOne', {username: deleteRequest.username})
        : t('users.confirmDeleteMany', {count: deleteRequest?.ids.length ?? 0});

    return (
        <div className="p-4">
            <h1 className="mb-4 text-2xl font-bold">{t('users.users')}</h1>

            <TableToolbar actions={selectedIds.length > 0 ? (
                <button
                    type="button"
                    className="btn btn-error btn-sm"
                    onClick={() => setDeleteRequest({ids: [...selectedIds]})}
                >
                    <TrashIcon className="h-4 w-4"/>
                    {t('users.deleteSelected')} ({selectedIds.length})
                </button>
            ) : undefined}>
                <TableSearchInput value={searchInput} onChange={setSearchInput} placeholder={t('users.search')}/>
                <TablePageSize value={query.limit} onChange={setLimit} label={t('table.perPage')}/>
                <TableSort
                    value={query.sort}
                    onChange={setSort}
                    label={t('table.sort')}
                    ascendingLabel={t('table.ascending')}
                    descendingLabel={t('table.descending')}
                />
            </TableToolbar>

            <EditUserModal
                user={editUser}
                saving={saving}
                onClose={closeEditModal}
                onSubmit={saveUser}
            />

            <UsersTable
                users={users}
                selectedIds={selectedIds}
                onToggleSelection={toggleSelection}
                onEdit={openEditModal}
                onRequestDelete={requestSingleDelete}
                isLoading={isLoading}
            />

            <TablePagination
                page={query.page}
                totalPages={totalPages}
                totalItems={totalItems}
                currentItems={users.length}
                onPageChange={setPage}
                label={t('users.users').toLocaleLowerCase()}
            />

            <ConfirmDialog
                open={deleteRequest !== null}
                title={t('users.confirmDeleteTitle')}
                message={deleteMessage}
                confirmLabel={t('users.delete')}
                cancelLabel={t('common.cancel')}
                loading={isDeleting}
                onCancel={() => !isDeleting && setDeleteRequest(null)}
                onConfirm={confirmDelete}
            />
        </div>
    );
};

export default UsersPage;
