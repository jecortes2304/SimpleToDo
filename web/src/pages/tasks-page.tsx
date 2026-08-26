import {useTranslation} from "react-i18next";
import React, {useCallback, useEffect, useRef, useState} from "react";
import {createTask, deleteTasks, getAllTasksByProject, updateTask} from "../services/task-service.ts";
import {Task, TaskCreateDto, TaskStatus, TaskUpdateDto} from "../schemas/task.ts";
import {useAlert} from "../hooks/use-alert.ts";
import {ApiResponse, DEFAULT_COLUMN_ORDER, Pagination, SortOrder, STORAGE_KEYS} from "../schemas/global.ts";
import {getUserProjects} from "../services/project-service.ts";
import {Project} from "../schemas/project.ts";
import {DragDropProvider} from '@dnd-kit/react';
import ColumnStatus from "../components/tasks/task-status-column.tsx";
import {move} from '@dnd-kit/helpers';
import ModalCreateUpdateTask from "../components/tasks/task-form-modal.tsx";
import TaskCard, {TaskCardData} from "../components/tasks/task-card.tsx";
import {useLocalStorage} from "../hooks/use-storage.ts";
import {PlusIcon, TrashIcon} from "@heroicons/react/16/solid";
import {useDebounce} from "../hooks/use-debounce.ts";
import NotFoundSearch from "../components/shared/empty-search-state.tsx";
import {TablePageSize, TablePagination, TableSearchInput, TableSort, TableToolbar} from "../components/shared/table";
import TaskProjectFilter from "../components/tasks/task-project-filter.tsx";


const TasksPage: React.FC = () => {
    const {t} = useTranslation();
    const alert = useAlert();

    const [items, setItems] = useState<Record<TaskStatus, Task[]>>({
        ongoing: [],
        blocked: [],
        completed: [],
        pending: [],
        cancelled: [],
    });

    const [tasks, setTasks] = useState<Task[]>([]);
    const [currentItems, setCurrentItems] = useState<number>(0);
    const [page, setPage] = useLocalStorage<number>(STORAGE_KEYS.PAGE, 1);
    const [limit, setLimit] = useLocalStorage<number>(STORAGE_KEYS.TASKS_LIMIT, 100);
    const [sort, setSort] = useLocalStorage<SortOrder>(STORAGE_KEYS.SORT, 'asc');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [selectedCardIds, setSelectedCardIds] = useState<number[]>([]);
    const [editMode, setEditMode] = useState(false);
    const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [totalPages, setTotalPages] = useLocalStorage<number>(STORAGE_KEYS.TASKS_TOTAL_PAGES, 1);
    const [totalItems, setTotalItems] = useLocalStorage<number>(STORAGE_KEYS.TASKS_TOTAL_ITEMS, 0);
    const [hasProjects, setHasProjects] = useState<boolean>(true);
    const [projectIdSelected, setProjectIdSelected] = useLocalStorage<number>(STORAGE_KEYS.TASKS_SELECTED_PROJECT, 0);
    const [columnOrder, setColumnOrder] = useLocalStorage<TaskStatus[]>(STORAGE_KEYS.TASKS_COLUMN_ORDER, DEFAULT_COLUMN_ORDER);
    const latestTasksRequestId = useRef(0);

    const debouncedSearchTerm = useDebounce(searchTerm, 400);

    const toggleModal = (edit: boolean, task: Task | null) => {
        setEditMode(edit);
        setTaskToEdit(task);
        const modal = document.getElementById('modalCreateTask') as HTMLDialogElement;
        modal.showModal();
    };

    const onConfirmFunction = (title: string, description: string, selectedProjectId: number) => {
        const taskCreateDto: TaskCreateDto = {
            title,
            description
        };
        createTaskCallback(taskCreateDto, selectedProjectId);
    };

    const onEditConfirm = async (title: string, description: string, status: TaskStatus) => {
        if (!taskToEdit) return;

        const updatedTaskDto: {
            id: number;
            title: string;
            description: string;
            status: "pending" | "ongoing" | "completed" | "blocked" | "cancelled";
            statusId: number;
            userId: number;
            projectId: number;
            createdAt: string;
            updatedAt: string
        } = {
            ...taskToEdit,
            title,
            description,
            status
        };

        await updateTaskCallback(updatedTaskDto, taskToEdit.id);
    };

    const toggleTaskSelection = (taskId: number) => {
        setSelectedCardIds((prev) =>
            prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
        );
    };

    const toggleSelectAllByColumn = (column: TaskStatus) => {
        const columnTaskIds = items[column].map(task => task.id);
        const allSelected = columnTaskIds.length > 0 && columnTaskIds.every(id => selectedCardIds.includes(id));

        if (allSelected) {
            setSelectedCardIds(prev => prev.filter(id => !columnTaskIds.includes(id)));
            return;
        }

        setSelectedCardIds(prev => [...new Set([...prev, ...columnTaskIds])]);
    };

    const handleDeleteSelected = async () => {
        if (selectedCardIds.length === 0) return;

        const confirmed = window.confirm(
            selectedCardIds.length === 1
                ? t('tasks.confirmDeleteOne') || '¿Seguro que quieres eliminar esta tarea?'
                : t('tasks.confirmDeleteMany', {count: selectedCardIds.length}) || `¿Seguro que quieres eliminar ${selectedCardIds.length} tareas?`
        );

        if (!confirmed) return;

        const response: ApiResponse<Task> = await deleteTasks(selectedCardIds);

        if (response.statusCode === 200) {
            setTasks(prev => prev.filter(task => !selectedCardIds.includes(task.id)));
            setSelectedCardIds([]);
            alert(t('tasks.taskDeletedOk'), 'alert-success');
        } else {
            console.error(response);
            alert(t('tasks.taskDeletedError'), 'alert-error');
        }
    };

    const getTasksCallbackByParams = useCallback(async (
        limit: number, page: number, sort: SortOrder, projectId: number, taskTitle?: string) => {
        const requestId = ++latestTasksRequestId.current;
        const response: ApiResponse<Task> = await getAllTasksByProject(
            limit,
            page,
            sort,
            projectId,
            taskTitle
        );

        if (requestId !== latestTasksRequestId.current) return;

        if (response.ok && response.statusCode === 200 && response.result) {
            const taskPagination: Pagination<Task> = response.result as Pagination<Task>;
            const newTasks = taskPagination.items;
            setTasks(newTasks);
            setCurrentItems(taskPagination.items.length);
            setTotalPages(taskPagination.totalPages);
            setTotalItems(taskPagination.totalItems);
        } else {
            alert(response.errors! as string, 'alert-error');
        }
    }, [alert, setTotalItems, setTotalPages]);

    const updateStatus = async (data: TaskCardData) => {
        if (!data || data.type !== 'item') {
            return;
        }

        const { itemId, toColumn } = data;
        const taskToUpdate = tasks.find(task => task.id === itemId);
        if (!taskToUpdate) {
            return;
        }

        const currentColumn = taskToUpdate.status;

        if (toColumn === currentColumn) {
            makeRollback(data.itemId, currentColumn);
            return;
        }

        const optimisticTask = {
            ...taskToUpdate,
            status: toColumn,
        };

        setTasks(prev =>
            prev.map(task => task.id === itemId ? optimisticTask : task)
        );

        const response: ApiResponse<Task> = await updateTask(optimisticTask, itemId);

        if (response.statusCode === 200 && response.result) {
            const updatedTaskFromBackend = response.result as Task;

            setTasks(prev =>
                prev.map(task => task.id === itemId ? updatedTaskFromBackend : task)
            );
        } else {
            makeRollback(itemId, currentColumn);
            alert(t('tasks.taskUpdatedError'), 'alert-error');
        }
    };

    const makeRollback = (taskId: number, previousStatus: TaskStatus) => {
        setTasks(prev =>
            prev.map(task =>
                task.id === taskId ? { ...task, status: previousStatus } : task
            )
        );
    }


    const updateTaskCallback = useCallback(async (taskUpdateDto: TaskUpdateDto, taskId: number) => {
        const response: ApiResponse<Task> = await updateTask(taskUpdateDto, taskId);

        if (response.statusCode === 200 && response.result) {
            const updatedTaskFromBackend = response.result as Task;

            setTasks(prev =>
                prev.map(task => task.id === taskId ? updatedTaskFromBackend : task)
            );

            alert(t('tasks.taskUpdatedOk'), 'alert-success');
            return updatedTaskFromBackend;
        } else {
            alert(t('tasks.taskUpdatedError'), 'alert-error');
            return null;
        }
    }, [t, alert]);

    const createTaskCallback = useCallback(async (taskCreateDto: TaskCreateDto, projectId: number) => {
        const response: ApiResponse<Task> = await createTask(taskCreateDto, projectId);
        if (response.statusCode === 201) {
            const taskCreated: Task = response.result as Task;
            setTasks(prevTasks => [...prevTasks, taskCreated]);
            getTasksCallbackByParams(limit, page, sort, projectId).then();
            alert(t('tasks.taskCreatedOk'), 'alert-success');
        } else {
            alert(t('tasks.taskCreatedError'), 'alert-error');
        }
    }, [alert, getTasksCallbackByParams, limit, page, sort, t]);

    const checkUserProjects = useCallback(async () => {
        const response = await getUserProjects(100, 1, sort);
        if (response.ok && response.result) {
            const projectPagination = response.result as Pagination<Project>;
            setHasProjects(projectPagination.totalItems > 0);
            const items: Project[] = projectPagination.items
            setProjects(items);
            if (items.length > 0) {
                if (projectIdSelected === 0) {
                    setProjectIdSelected(projectPagination.items[0].id);
                } else if (!projectPagination.items.some(item => item.id === projectIdSelected)) {
                    setProjectIdSelected(projectPagination.items[0].id);
                }
            }
        } else {
            setHasProjects(false);
        }
    }, [sort, projectIdSelected, setProjectIdSelected]);

    useEffect(() => {
        setItems({
            pending: tasks.filter(task => task.status === 'pending'),
            completed: tasks.filter(task => task.status === 'completed'),
            cancelled: tasks.filter(task => task.status === 'cancelled'),
            blocked: tasks.filter(task => task.status === 'blocked'),
            ongoing: tasks.filter(task => task.status === 'ongoing'),
        });
    }, [tasks]);

    useEffect(() => {
        checkUserProjects().then();
    }, [checkUserProjects]);

    useEffect(() => {
        if (projectIdSelected > 0) {
            getTasksCallbackByParams(
                limit,
                page,
                sort,
                projectIdSelected,
                debouncedSearchTerm
            ).then();
        }
    }, [debouncedSearchTerm, getTasksCallbackByParams, limit, page, projectIdSelected, sort]);

    return (
        <div className="w-full p-4">
            <h1 className="mb-4 text-2xl font-bold">{t('tasks.tasks')}</h1>

            <TableToolbar
                actions={(
                    <>
                        {selectedCardIds.length > 0 && (
                            <button
                                type="button"
                                onClick={handleDeleteSelected}
                                className="btn btn-error btn-sm"
                                title={t('tasks.deleteSelected')}
                            >
                                <TrashIcon className="h-4 w-4"/>
                                {t('tasks.deleteSelected')} ({selectedCardIds.length})
                            </button>
                        )}
                        <TaskProjectFilter
                            projects={projects}
                            value={projectIdSelected}
                            disabled={!hasProjects}
                            placeholder={t('tasks.projects')}
                            onChange={projectId => {
                                setProjectIdSelected(projectId);
                                setPage(1);
                            }}
                        />
                        <button
                            type="button"
                            className="btn btn-primary btn-sm shrink-0"
                            onClick={() => toggleModal(false, null)}
                            disabled={!hasProjects}
                            title={hasProjects ? t('tasks.addTask') : t('tasks.noProjectsToCreate')}
                        >
                            <PlusIcon className="h-4 w-4"/>
                            {t('tasks.addTask')}
                        </button>
                    </>
                )}
            >
                <TableSearchInput
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder={t('tasks.search')}
                />
                <TablePageSize
                    value={limit}
                    label={t('table.perPage')}
                    onChange={nextLimit => {
                        setLimit(nextLimit);
                        setPage(1);
                    }}
                />
                <TableSort
                    value={sort}
                    label={t('table.sort')}
                    ascendingLabel={t('table.ascending')}
                    descendingLabel={t('table.descending')}
                    onChange={nextSort => {
                        setSort(nextSort);
                        setPage(1);
                    }}
                />
            </TableToolbar>

            <div className="mb-10 flex flex-col gap-4">
                <div className="rounded-box border border-base-300 bg-base-100 p-3">
                    {currentItems > 0 ? (
                        <DragDropProvider
                            onDragOver={(event) => {
                                const {source} = event.operation;

                                if (source?.type === 'column') return;

                                setItems((items) => move(items, event));
                            }}
                            onDragEnd={(event) => {
                                const {source} = event.operation;

                                const data: TaskCardData = source?.data as TaskCardData;
                                updateStatus(data);

                                if (event.canceled || source?.type !== 'column') return;

                                setColumnOrder((columns) => move(columns, event));
                            }}
                        >
                            <div className="overflow-x-auto pb-2">
                                <div className="flex gap-4 items-start min-w-max">
                                    {columnOrder.map((column, columnIndex) => {
                                        const allSelectedInColumn =
                                            items[column].length > 0 &&
                                            items[column].every(task => selectedCardIds.includes(task.id));

                                        return (
                                            <ColumnStatus
                                                columnTitle={t(`tasks.status.${column.toLowerCase()}`)}
                                                key={column}
                                                id={column}
                                                itemCount={items[column].length}
                                                index={columnIndex}
                                                allSelected={allSelectedInColumn}
                                                onToggleSelectAll={() => toggleSelectAllByColumn(column)}
                                            >
                                                {items[column].map((task, index) => (
                                                    <TaskCard
                                                        key={`item-key-${task.id}`}
                                                        idItem={`item-id-${task.id}`}
                                                        id={task.id}
                                                        index={index}
                                                        currentColumn={column}
                                                        status={task.status}
                                                        projectId={task.projectId}
                                                        createdAt={new Date(task.createdAt)}
                                                        updatedAt={new Date(task.updatedAt)}
                                                        title={task.title}
                                                        description={task.description}
                                                        selected={selectedCardIds.includes(task.id)}
                                                        onToggle={() => toggleTaskSelection(task.id)}
                                                        onEdit={() => toggleModal(true, task)}
                                                    />
                                                ))}
                                            </ColumnStatus>
                                        );
                                    })}
                                </div>
                            </div>
                        </DragDropProvider>
                    ) : (
                        <NotFoundSearch />
                    )}
                </div>
            </div>
            <TablePagination
                page={page}
                totalPages={totalPages}
                totalItems={totalItems}
                currentItems={currentItems}
                onPageChange={setPage}
                maxVisiblePages={5}
                label={t('tasks.tasks')}
            />

            <ModalCreateUpdateTask
                modalTitle={editMode ? t('tasks.editTask') : t('tasks.addTask')}
                onCreate={!editMode ? onConfirmFunction : undefined}
                onEdit={editMode ? onEditConfirm : undefined}
                task={taskToEdit}
                editMode={editMode}
                initialProjectId={projectIdSelected}
            />
        </div>
    );
};

export default TasksPage;
