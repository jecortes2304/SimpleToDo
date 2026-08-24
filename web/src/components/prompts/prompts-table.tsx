import {useMemo} from 'react';
import {useTranslation} from 'react-i18next';
import {PencilSquareIcon, TrashIcon} from '@heroicons/react/16/solid';
import {Prompt} from '../../schemas/prompt.ts';
import {defineColumns, SharedTable} from '../shared/table';

type PromptsTableProps = {
    prompts: readonly Prompt[];
    selectedIds: readonly number[];
    onToggleSelection: (id: number) => void;
    onEdit: (prompt: Prompt) => void;
    onRequestDelete: (prompt: Prompt) => void;
    isLoading?: boolean;
};

const formatDate = (value: string) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
};

function PromptsTable({
    prompts,
    selectedIds,
    onToggleSelection,
    onEdit,
    onRequestDelete,
    isLoading = false,
}: PromptsTableProps) {
    const {t} = useTranslation();
    const columns = useMemo(() => defineColumns<Prompt>()([
        {
            id: 'selection',
            label: <span className="sr-only">{t('prompts.select')}</span>,
            render: prompt => (
                <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={selectedIds.includes(prompt.id)}
                    aria-label={t('prompts.selectPrompt', {title: prompt.title})}
                    onChange={() => onToggleSelection(prompt.id)}
                />
            ),
            headerClassName: 'w-12',
            cellClassName: 'w-12',
        },
        {id: 'id', label: 'ID', accessorKey: 'id', cellClassName: 'font-mono text-xs'},
        {id: 'title', label: t('prompts.title'), accessorKey: 'title', cellClassName: 'min-w-40 font-semibold'},
        {
            id: 'description',
            label: t('prompts.description'),
            render: prompt => (
                <span className="block min-w-56 max-w-md whitespace-normal" title={prompt.description}>
                    {prompt.description}
                </span>
            ),
        },
        {
            id: 'systemPrompt',
            label: t('prompts.systemPromptShort'),
            render: prompt => (
                <span className="block min-w-56 max-w-md whitespace-normal" title={prompt.systemPrompt}>
                    {prompt.systemPrompt}
                </span>
            ),
        },
        {
            id: 'createdAt',
            label: t('prompts.createdAt'),
            render: prompt => formatDate(prompt.createdAt),
            cellClassName: 'whitespace-nowrap',
        },
        {
            id: 'updatedAt',
            label: t('prompts.updateAt'),
            render: prompt => formatDate(prompt.updatedAt),
            cellClassName: 'whitespace-nowrap',
        },
        {
            id: 'actions',
            label: t('prompts.actions'),
            render: prompt => (
                <div className="flex gap-2 whitespace-nowrap">
                    <button
                        type="button"
                        className="btn btn-sm btn-outline btn-info"
                        title={t('prompts.update')}
                        aria-label={t('prompts.editPrompt', {title: prompt.title})}
                        onClick={() => onEdit(prompt)}
                    >
                        <PencilSquareIcon className="h-4 w-4"/>
                    </button>
                    <button
                        type="button"
                        className="btn btn-sm btn-outline btn-error"
                        title={t('prompts.delete')}
                        aria-label={t('prompts.deletePrompt', {title: prompt.title})}
                        onClick={() => onRequestDelete(prompt)}
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
                rows={prompts}
                getRowKey={prompt => prompt.id}
                isLoading={isLoading}
            />
        </div>
    );
}

export default PromptsTable;
