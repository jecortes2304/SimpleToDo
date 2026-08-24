import {useMemo} from 'react';
import {useTranslation} from 'react-i18next';
import {PencilSquareIcon, TrashIcon} from '@heroicons/react/16/solid';
import {Project} from '../../schemas/project.ts';
import {defineColumns, SharedTable} from '../shared/table';

type ProjectsTableProps = {
    projects: readonly Project[];
    selectedIds: readonly number[];
    onToggleSelection: (id: number) => void;
    onEdit: (project: Project) => void;
    onRequestDelete: (project: Project) => void;
    isLoading?: boolean;
};

const formatDate = (value: string) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
};

function ProjectsTable({
    projects,
    selectedIds,
    onToggleSelection,
    onEdit,
    onRequestDelete,
    isLoading = false,
}: ProjectsTableProps) {
    const {t} = useTranslation();

    const columns = useMemo(() => defineColumns<Project>()([
        {
            id: 'selection',
            label: <span className="sr-only">{t('projects.select')}</span>,
            render: project => (
                <input
                    type="checkbox"
                    aria-label={t('projects.selectProject', {name: project.name})}
                    checked={selectedIds.includes(project.id)}
                    onChange={() => onToggleSelection(project.id)}
                    className="checkbox checkbox-sm"
                />
            ),
            headerClassName: 'w-12',
            cellClassName: 'w-12',
        },
        {
            id: 'id',
            label: 'ID',
            accessorKey: 'id',
            headerClassName: 'whitespace-nowrap',
            cellClassName: 'font-mono text-xs',
        },
        {
            id: 'name',
            label: t('projects.name'),
            accessorKey: 'name',
            cellClassName: 'font-semibold min-w-40',
        },
        {
            id: 'description',
            label: t('projects.description'),
            render: project => (
                <span className="block min-w-56 max-w-md whitespace-normal" title={project.description}>
                    {project.description}
                </span>
            ),
        },
        {
            id: 'tasks',
            label: t('projects.tasks'),
            render: project => project.tasks?.length ?? 0,
            headerClassName: 'text-center whitespace-nowrap',
            cellClassName: 'text-center',
        },
        {
            id: 'createdAt',
            label: t('projects.createdAt'),
            render: project => formatDate(project.createdAt),
            headerClassName: 'whitespace-nowrap',
            cellClassName: 'whitespace-nowrap',
        },
        {
            id: 'updatedAt',
            label: t('projects.updatedAt'),
            render: project => formatDate(project.updatedAt),
            headerClassName: 'whitespace-nowrap',
            cellClassName: 'whitespace-nowrap',
        },
        {
            id: 'actions',
            label: t('projects.actions'),
            render: project => (
                <div className="flex gap-2 whitespace-nowrap">
                    <button
                        type="button"
                        className="btn btn-sm btn-outline btn-info"
                        aria-label={t('projects.editProject', {name: project.name})}
                        title={t('projects.update')}
                        onClick={() => onEdit(project)}
                    >
                        <PencilSquareIcon className="h-4 w-4"/>
                    </button>
                    <button
                        type="button"
                        className="btn btn-sm btn-outline btn-error"
                        aria-label={t('projects.deleteProject', {name: project.name})}
                        title={t('projects.delete')}
                        onClick={() => onRequestDelete(project)}
                    >
                        <TrashIcon className="h-4 w-4"/>
                    </button>
                </div>
            ),
            headerClassName: 'whitespace-nowrap',
        },
    ]), [onEdit, onRequestDelete, onToggleSelection, selectedIds, t]);

    return (
        <div className="overflow-x-auto rounded-box border border-base-300">
            <SharedTable
                columns={columns}
                rows={projects}
                getRowKey={project => project.id}
                isLoading={isLoading}
            />
        </div>
    );
}

export default ProjectsTable;
