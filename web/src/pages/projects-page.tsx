import React, {useCallback, useEffect, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {PlusIcon, TrashIcon} from '@heroicons/react/16/solid';
import {createProject, deleteProject, getUserProjects, updateProject} from '../services/project-service';
import {CreateProjectDto, Project, UpdateProjectDto} from '../schemas/project';
import {ApiResponse, Pagination} from '../schemas/global';
import {useAlert} from '../hooks/use-alert.ts';
import {useServerTableQuery} from '../hooks/use-server-table-query.ts';
import ModalCreateUpdateProject from '../components/projects/project-form-modal.tsx';
import ProjectsTable from '../components/projects/projects-table.tsx';
import ConfirmDialog from '../components/shared/confirm-dialog.tsx';
import {
    TablePageSize,
    TablePagination,
    TableSearchInput,
    TableSort,
    TableToolbar,
} from '../components/shared/table';

type DeleteRequest = {
    ids: number[];
    projectName?: string;
};

const ProjectsPage: React.FC = () => {
    const {t} = useTranslation();
    const alert = useAlert();
    const {query, searchInput, setSearchInput, setPage, setLimit, setSort} = useServerTableQuery(100);

    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectIds, setSelectedProjectIds] = useState<number[]>([]);
    const [editMode, setEditMode] = useState(false);
    const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [deleteRequest, setDeleteRequest] = useState<DeleteRequest | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const latestRequestId = useRef(0);

    const fetchProjects = useCallback(async () => {
        const requestId = ++latestRequestId.current;
        setIsLoading(true);
        const response: ApiResponse<Project> = await getUserProjects(
            query.limit,
            query.page,
            query.sort,
            query.search,
        );

        if (requestId !== latestRequestId.current) return;

        if (response.ok && response.result) {
            const paginated = response.result as Pagination<Project>;
            setProjects(paginated.items);
            setTotalPages(paginated.totalPages);
            setTotalItems(paginated.totalItems);
            setSelectedProjectIds(previous =>
                previous.filter(id => paginated.items.some(project => project.id === id)),
            );
        } else {
            alert(response.errors as string, 'alert-error');
        }
        setIsLoading(false);
    }, [alert, query]);

    useEffect(() => {
        fetchProjects().then();
    }, [fetchProjects]);

    const handleUpdate = useCallback(async (updatedProject: UpdateProjectDto) => {
        const response = await updateProject(updatedProject.id, updatedProject);
        if (response.statusCode === 200) {
            alert(t('projects.updated'), 'alert-success');
            await fetchProjects();
        } else {
            alert(response.errors as string, 'alert-error');
        }
    }, [alert, fetchProjects, t]);

    const handleCreate = useCallback(async (newProject: CreateProjectDto) => {
        const response = await createProject(newProject);
        if (response.statusCode === 201) {
            alert(t('projects.created'), 'alert-success');
            await fetchProjects();
        } else {
            alert(response.errors as string, 'alert-error');
        }
    }, [alert, fetchProjects, t]);

    const handleModalConfirm = (name: string, description: string) => {
        if (editMode && projectToEdit) {
            handleUpdate({id: projectToEdit.id, name, description}).then();
            return;
        }
        handleCreate({name, description}).then();
    };

    const openEditModal = useCallback((project: Project) => {
        setEditMode(true);
        setProjectToEdit(project);
        (document.getElementById('modalCreateProject') as HTMLDialogElement).showModal();
    }, []);

    const openCreateModal = () => {
        setEditMode(false);
        setProjectToEdit(null);
        (document.getElementById('modalCreateProject') as HTMLDialogElement).showModal();
    };

    const toggleSelection = useCallback((id: number) => {
        setSelectedProjectIds(previous =>
            previous.includes(id)
                ? previous.filter(projectId => projectId !== id)
                : [...previous, id],
        );
    }, []);

    const requestSingleDelete = useCallback((project: Project) => {
        setDeleteRequest({ids: [project.id], projectName: project.name});
    }, []);

    const requestSelectedDelete = () => {
        setDeleteRequest({ids: [...selectedProjectIds]});
    };

    const confirmDelete = async () => {
        if (!deleteRequest || deleteRequest.ids.length === 0) return;

        setIsDeleting(true);
        const responses = await Promise.all(deleteRequest.ids.map(id => deleteProject(id)));
        const failed = responses.filter(response => !response.ok);

        if (failed.length > 0) {
            alert(failed[0].errors as string, 'alert-error');
        } else {
            alert(
                deleteRequest.ids.length === 1 ? t('projects.deleted') : t('projects.deletedMultiple'),
                'alert-success',
            );
            setSelectedProjectIds(previous =>
                previous.filter(id => !deleteRequest.ids.includes(id)),
            );
            setDeleteRequest(null);
            await fetchProjects();
        }
        setIsDeleting(false);
    };

    const deleteMessage = deleteRequest?.ids.length === 1
        ? t('projects.confirmDeleteOne', {name: deleteRequest.projectName})
        : t('projects.confirmDeleteMany', {count: deleteRequest?.ids.length ?? 0});

    return (
        <div className="p-1">
            <h1 className="mb-4 text-2xl font-bold">{t('projects.projects')}</h1>

            <TableToolbar
                actions={(
                    <>
                        {selectedProjectIds.length > 0 && (
                            <button type="button" className="btn btn-error btn-sm" onClick={requestSelectedDelete}>
                                <TrashIcon className="h-4 w-4"/>
                                {t('projects.deleteSelected')} ({selectedProjectIds.length})
                            </button>
                        )}
                        <button type="button" className="btn btn-primary btn-sm" onClick={openCreateModal}>
                            <PlusIcon className="h-4 w-4"/>
                            {t('projects.create')}
                        </button>
                    </>
                )}
            >
                <TableSearchInput
                    value={searchInput}
                    onChange={setSearchInput}
                    placeholder={t('projects.search')}
                />
                <TablePageSize
                    value={query.limit}
                    label={t('table.perPage')}
                    onChange={setLimit}
                />
                <TableSort
                    value={query.sort}
                    label={t('table.sort')}
                    ascendingLabel={t('table.ascending')}
                    descendingLabel={t('table.descending')}
                    onChange={setSort}
                />
            </TableToolbar>

            <ModalCreateUpdateProject
                project={projectToEdit!}
                editMode={editMode}
                modalTitle={editMode ? t('projects.update') : t('projects.create')}
                onCreateOrUpdate={handleModalConfirm}
            />

            <ProjectsTable
                projects={projects}
                selectedIds={selectedProjectIds}
                onToggleSelection={toggleSelection}
                onEdit={openEditModal}
                onRequestDelete={requestSingleDelete}
                isLoading={isLoading}
            />

            <TablePagination
                page={query.page}
                totalPages={totalPages}
                totalItems={totalItems}
                currentItems={projects.length}
                onPageChange={setPage}
                label={t('projects.projects').toLocaleLowerCase()}
            />

            <ConfirmDialog
                open={deleteRequest !== null}
                title={t('projects.confirmDeleteTitle')}
                message={deleteMessage}
                confirmLabel={t('projects.delete')}
                cancelLabel={t('common.cancel')}
                loading={isDeleting}
                onCancel={() => !isDeleting && setDeleteRequest(null)}
                onConfirm={confirmDelete}
            />
        </div>
    );
};

export default ProjectsPage;
