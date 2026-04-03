import {useTranslation} from "react-i18next";
import React, {useCallback, useEffect, useState} from "react";
import {createTask, deleteTasks, getAllTasksByProject, updateTask} from "../services/TaskService.ts";
import {Task, TaskCreateDto, TaskStatus, TaskUpdateDto} from "../schemas/tasks.ts";
import {useAlert} from "../hooks/useAlert.ts";
import {ApiResponse, DEFAULT_COLUMN_ORDER, Pagination, SortOrder, STORAGE_KEYS} from "../schemas/globals.ts";
import {getUserProjects} from "../services/ProjectService.ts";
import {Project} from "../schemas/projects.ts";
import {DragDropProvider} from '@dnd-kit/react';
import ColumnStatus from "../components/ColumnStatus.tsx";
import {move} from '@dnd-kit/helpers';
import ModalCreateUpdateTask from "../components/ModalCreateUpdateTask.tsx";
import TaskCard, {TaskCardData} from "../components/TaskCard.tsx";
import Lottie from "lottie-react";
import notFoundLottie from "../assets/lottie/not_found_lottie.json";
import {useLocalStorage} from "../hooks/useStorage.ts";
import {MagnifyingGlassIcon, PlusIcon, TrashIcon} from "@heroicons/react/16/solid";
import AmountItemsComponent from "../components/AmountItemsComponent.tsx";
import {useDebounce} from "../hooks/useDebounce.ts";
import PaginationComponent from "../components/PaginationComponent.tsx";

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

        const updatedTaskDto: TaskUpdateDto = {
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

    const getTasksCallbackByParams = async (
        limit: number,
        page: number,
        sort: SortOrder,
        projectId: number,
        taskTitle?: string
    ) => {
        const response: ApiResponse<Task> = await getAllTasksByProject(
            limit,
            page,
            sort,
            projectId,
            taskTitle
        );

        if (response.ok && response.statusCode === 200 && response.result) {
            const taskPagination: Pagination<Task> = response.result as Pagination<Task>;
            const newTasks = taskPagination.items;
            setTasks(newTasks);
            setCurrentItems(taskPagination.items.length);
            setTotalPages(taskPagination.totalPages);
            setTotalItems(taskPagination.totalItems);
            setPage(taskPagination.page);
            setLimit(taskPagination.limit);
            setSort(taskPagination.sort);
        } else {
            alert(response.errors! as string, 'alert-error');
        }
    };

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
    }, [limit, page, sort]);

    const checkUserProjects = useCallback(async () => {
        const response = await getUserProjects(100, 1, sort);
        if (response.ok && response.result) {
            const projectPagination = response.result as Pagination<Project>;
            setHasProjects(projectPagination.totalItems > 0);
            setProjects(projectPagination.items);
        } else {
            setHasProjects(false);
        }
    }, [limit, page, sort, projectIdSelected, setProjectIdSelected]);

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
    }, [limit, page, projectIdSelected, debouncedSearchTerm]);

    return (
        <div className="w-full">
            <h1 className="text-2xl font-bold">{t('tasks.tasks')}</h1>
            <div className="divider"></div>

            <div className="mx-1 mb-5 flex flex-col gap-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <label className="input w-full sm:max-w-sm">
                                <MagnifyingGlassIcon className="h-5 w-5"/>
                                <input
                                    type="search"
                                    className="grow min-w-0"
                                    placeholder={t('tasks.search')}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value.trim())}
                                />
                                <kbd className="kbd kbd-sm">⌘</kbd>
                                <kbd className="kbd kbd-sm">K</kbd>
                            </label>

                            <div className="w-fit shrink-0">
                                <AmountItemsComponent setLimit={setLimit} setPage={setPage}/>
                            </div>
                        </div>

                        {selectedCardIds.length > 0 && (
                            <div className="w-fit shrink-0">
                                <button
                                    onClick={handleDeleteSelected}
                                    className="btn btn-error btn-sm"
                                    title={t('tasks.deleteSelected')}
                                >
                                    <TrashIcon className="mr-1 h-4 w-4"/>
                                    ({selectedCardIds.length})
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex min-w-0 items-center gap-3 sm:justify-end">
                        <fieldset className="min-w-0 flex-1 sm:flex-none sm:min-w-55">
                            <select
                                value={projectIdSelected}
                                className="select w-full"
                                disabled={!hasProjects}
                                onChange={(e) => {
                                    const selectedId = parseInt(e.target.value);
                                    setProjectIdSelected(selectedId);
                                    setPage(1);
                                }}
                            >
                                <option value={0} disabled>{t('tasks.projects')}</option>
                                {projects.map((project) => (
                                    <option key={project.id} value={project.id}>
                                        {project.name}
                                    </option>
                                ))}
                            </select>
                        </fieldset>

                        <button
                            className="btn btn-primary btn-sm shrink-0"
                            onClick={() => toggleModal(false, null)}
                            disabled={!hasProjects}
                            title={hasProjects ? t('tasks.addTask') : t('tasks.noProjectsToCreate')}
                        >
                            <PlusIcon className="h-5 w-5"/>
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-4 mx-1 mb-10">
                <div className="p-3 border border-base-200 rounded-lg shadow-lg">
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
                        <div className="col-span-full flex justify-center items-center min-h-50">
                            <Lottie className="h-50 w-50" animationData={notFoundLottie} loop={true}/>
                        </div>
                    )}
                </div>
            </div>
            <PaginationComponent
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
            />
        </div>
    );
};

export default TasksPage;