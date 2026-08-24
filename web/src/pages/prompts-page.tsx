import React, {useCallback, useEffect, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {PlusIcon, TrashIcon} from '@heroicons/react/16/solid';
import {createPrompt, deletePrompt, getPrompts, updatePrompt} from '../services/prompt-service';
import {CreatePromptDto, Prompt, UpdatePromptDto} from '../schemas/prompt';
import {ApiResponse, Pagination} from '../schemas/global';
import {useAlert} from '../hooks/use-alert.ts';
import {useServerTableQuery} from '../hooks/use-server-table-query.ts';
import ModalCreateUpdatePrompt from '../components/prompts/prompt-form-modal.tsx';
import PromptsTable from '../components/prompts/prompts-table.tsx';
import ConfirmDialog from '../components/shared/confirm-dialog.tsx';
import {TablePageSize, TablePagination, TableSearchInput, TableSort, TableToolbar} from '../components/shared/table';

type DeleteRequest = {ids: number[]; title?: string};

const PromptsPage: React.FC = () => {
    const {t} = useTranslation();
    const alert = useAlert();
    const {query, searchInput, setSearchInput, setPage, setLimit, setSort} = useServerTableQuery(10);

    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [editMode, setEditMode] = useState(false);
    const [promptToEdit, setPromptToEdit] = useState<Prompt | null>(null);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [deleteRequest, setDeleteRequest] = useState<DeleteRequest | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const latestRequestId = useRef(0);

    const fetchPrompts = useCallback(async () => {
        const requestId = ++latestRequestId.current;
        setIsLoading(true);
        const response: ApiResponse<Prompt> = await getPrompts(query.limit, query.page, query.sort, query.search);
        if (requestId !== latestRequestId.current) return;

        if (response.ok && response.result) {
            const paginated = response.result as Pagination<Prompt>;
            setPrompts(paginated.items);
            setTotalPages(paginated.totalPages);
            setTotalItems(paginated.totalItems);
            setSelectedIds(previous => previous.filter(id => paginated.items.some(prompt => prompt.id === id)));
        } else {
            alert(response.errors as string, 'alert-error');
        }
        setIsLoading(false);
    }, [alert, query]);

    useEffect(() => {
        fetchPrompts().then();
    }, [fetchPrompts]);

    const handleUpdate = useCallback(async (id: number, prompt: UpdatePromptDto) => {
        const response = await updatePrompt(id, prompt);
        if (response.statusCode === 200) {
            alert(t('prompts.updated'), 'alert-success');
            await fetchPrompts();
        } else {
            alert(response.errors as string, 'alert-error');
        }
    }, [alert, fetchPrompts, t]);

    const handleCreate = useCallback(async (prompt: CreatePromptDto) => {
        const response = await createPrompt(prompt);
        if (response.statusCode === 201) {
            alert(t('prompts.created'), 'alert-success');
            await fetchPrompts();
        } else {
            alert(response.errors as string, 'alert-error');
        }
    }, [alert, fetchPrompts, t]);

    const handleModalConfirm = (title: string, description: string, systemPrompt: string) => {
        if (editMode && promptToEdit) {
            handleUpdate(promptToEdit.id, {title, description, systemPrompt}).then();
            return;
        }
        handleCreate({title, description, systemPrompt}).then();
    };

    const openEditModal = useCallback((prompt: Prompt) => {
        setEditMode(true);
        setPromptToEdit(prompt);
        (document.getElementById('modalCreatePrompt') as HTMLDialogElement).showModal();
    }, []);

    const openCreateModal = () => {
        setEditMode(false);
        setPromptToEdit(null);
        (document.getElementById('modalCreatePrompt') as HTMLDialogElement).showModal();
    };

    const toggleSelection = useCallback((id: number) => {
        setSelectedIds(previous => previous.includes(id) ? previous.filter(item => item !== id) : [...previous, id]);
    }, []);

    const requestSingleDelete = useCallback((prompt: Prompt) => {
        setDeleteRequest({ids: [prompt.id], title: prompt.title});
    }, []);

    const confirmDelete = async () => {
        if (!deleteRequest?.ids.length) return;
        setIsDeleting(true);
        const responses = await Promise.all(deleteRequest.ids.map(deletePrompt));
        const failed = responses.find(response => !response.ok);

        if (failed) {
            alert(failed.errors as string, 'alert-error');
        } else {
            alert(deleteRequest.ids.length === 1 ? t('prompts.deleted') : t('prompts.deletedMultiple'), 'alert-success');
            setSelectedIds(previous => previous.filter(id => !deleteRequest.ids.includes(id)));
            setDeleteRequest(null);
            await fetchPrompts();
        }
        setIsDeleting(false);
    };

    const deleteMessage = deleteRequest?.ids.length === 1
        ? t('prompts.confirmDeleteOne', {title: deleteRequest.title})
        : t('prompts.confirmDeleteMany', {count: deleteRequest?.ids.length ?? 0});

    return (
        <div className="p-4">
            <h1 className="mb-4 text-2xl font-bold">{t('prompts.prompts')}</h1>

            <TableToolbar actions={(
                <>
                    {selectedIds.length > 0 && (
                        <button
                            type="button"
                            className="btn btn-error btn-sm"
                            onClick={() => setDeleteRequest({ids: [...selectedIds]})}
                        >
                            <TrashIcon className="h-4 w-4"/>
                            {t('prompts.deleteSelected')} ({selectedIds.length})
                        </button>
                    )}
                    <button type="button" className="btn btn-primary btn-sm" onClick={openCreateModal}>
                        <PlusIcon className="h-4 w-4"/>
                        {t('prompts.create')}
                    </button>
                </>
            )}>
                <TableSearchInput value={searchInput} onChange={setSearchInput} placeholder={t('prompts.search')}/>
                <TablePageSize value={query.limit} onChange={setLimit} label={t('table.perPage')}/>
                <TableSort
                    value={query.sort}
                    onChange={setSort}
                    label={t('table.sort')}
                    ascendingLabel={t('table.ascending')}
                    descendingLabel={t('table.descending')}
                />
            </TableToolbar>

            <ModalCreateUpdatePrompt
                prompt={promptToEdit!}
                editMode={editMode}
                modalTitle={editMode ? t('prompts.update') : t('prompts.create')}
                onCreateOrUpdate={handleModalConfirm}
            />

            <PromptsTable
                prompts={prompts}
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
                currentItems={prompts.length}
                onPageChange={setPage}
                label={t('prompts.prompts').toLocaleLowerCase()}
            />

            <ConfirmDialog
                open={deleteRequest !== null}
                title={t('prompts.confirmDeleteTitle')}
                message={deleteMessage}
                confirmLabel={t('prompts.delete')}
                cancelLabel={t('common.cancel')}
                loading={isDeleting}
                onCancel={() => !isDeleting && setDeleteRequest(null)}
                onConfirm={confirmDelete}
            />
        </div>
    );
};

export default PromptsPage;
