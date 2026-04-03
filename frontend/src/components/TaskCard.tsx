import React from 'react';
import {TaskStatus} from "../schemas/tasks.ts";
import {useTranslation} from 'react-i18next';
import {ArrowDownTrayIcon, ArrowPathIcon} from "@heroicons/react/16/solid";
import {useSortable} from "@dnd-kit/react/sortable";


export interface TaskCardData {
    type: string,
    itemId: number
    fromColumn: TaskStatus,
    toColumn: TaskStatus,
}

interface TaskCardProps {
    id: number;
    title: string;
    description: string;
    status: TaskStatus;
    projectId: number;
    createdAt: Date;
    updatedAt: Date;
    selected?: boolean;
    onToggle?: () => void;
    onEdit?: () => void;
    idItem: string;
    index: number;
    currentColumn: TaskStatus;
}



const TaskCard: React.FC<TaskCardProps> = ({
                                               id,
                                               title,
                                               description,
                                               status,
                                               projectId,
                                               createdAt,
                                               updatedAt,
                                               selected,
                                               onToggle,
                                               onEdit,
                                               index,
                                               currentColumn
                                           }) => {
    const {t} = useTranslation();
    const {ref, isDragging} = useSortable({
        id,
        index,
        data: {
            type: 'item',
            itemId: id,
            toColumn: currentColumn,
        } as TaskCardData,
        group: currentColumn,
        type: 'item',
        accept: ['item']
    });

    const renderStatusByType = (status: TaskStatus) => {
        switch (status) {
            case 'pending':
                return 'badge-dash badge-primary';
            case 'ongoing':
                return 'badge-primary';
            case 'completed':
                return 'badge-success';
            case 'blocked':
                return 'badge-error';
            case 'cancelled':
                return 'badge-warning';
            default:
                return 'badge-info';
        }
    };

    const renderBgByStatus = (status: TaskStatus) => {
        switch (status) {
            case 'completed':
                return 'bg-success/15';
            case 'pending':
                return 'bg-info/15';
            case 'ongoing':
                return 'bg-primary/15';
            case 'blocked':
                return 'bg-error/15';
            case 'cancelled':
                return 'bg-warning/15';
            default:
                return 'bg-info/15';
        }
    };

    const formatStatus = (status: string) => {
        const translated = t(`tasks.status.${status}`);
        return translated.charAt(0).toUpperCase() + translated.slice(1);
    };

    const formatDate = (date: Date) => {
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        };
        return new Date(date).toLocaleDateString('local', options);
    };

    return (
        <div ref={ref} data-dragging={isDragging}
                             className={`indicator flex justify-center items-center w-full transition-opacity duration-300 cursor-pointer ${
                selected ? 'opacity-50' : 'opacity-100'
            }`}
        >
            <span className={`indicator-item text-xs mt-4 me-12 badge badge-sm ${renderStatusByType(status)}`}>
        {formatStatus(status)}
      </span>
            <div className={`card w-full shadow-xl ${renderBgByStatus(status)}`}>
                <div
                    className="absolute top-1 left-1 text-xs text-gray-400">
                    <input
                        type="checkbox"
                        checked={selected}
                        readOnly
                        className="checkbox checkbox-sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggle?.();
                        }}
                    />
                </div>
                <span
                    className="absolute top-6 left-6 mb-3 pb-5 text-xs text-gray-400">● #{id} | {t('tasks.project')} {projectId}
                </span>
                <div className="card-body" onClick={() => onEdit?.()}>
                    <h2 className="card-title text-xs mt-5 font-semibold">{title}</h2>
                    <p className="text-xs text-gray-600 mt-1">{
                        description.length > 30
                            ? `${description.slice(0, 30)}...`
                            : description
                    }</p>
                    <div className="mt-3 inline-flex justify-between text-gray-400 items-center text-[10px] gap-3">
                        <div className="flex gap-1">
                            <ArrowDownTrayIcon className="h-3 w-3" title={t('tasks.createdAt')}/>
                            {formatDate(createdAt)}
                        </div>
                        <div className="flex gap-1">
                            <ArrowPathIcon className="h-3 w-3" title={t('tasks.updatedAt')}/>
                            {formatDate(updatedAt)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskCard;