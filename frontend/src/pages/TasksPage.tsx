import {useTranslation} from "react-i18next";
import TaskCard from "../components/TaskCard.tsx";
import React, {useCallback, useEffect, useState} from "react";
import {createTask, deleteTasks, getAllTasksByProject, updateTask} from "../services/TaskService.ts";
import {Task, TaskCreateDto, TaskStatus, TaskUpdateDto} from "../schemas/tasks.ts";
import {MagnifyingGlassIcon, PlusIcon, TrashIcon} from "@heroicons/react/16/solid";
import ModalCreateUpdateTask from "../components/ModalCreateUpdateTask.tsx";
import {useAlert} from "../hooks/useAlert.ts";
import {ApiResponse, Pagination, SortOrder} from "../schemas/globals.ts";
import PaginationComponent from "../components/PaginationComponent.tsx";
import AmountItemsComponent from "../components/AmountItemsComponent.tsx";
import Lottie from "lottie-react";
import notFoundLottie from "../assets/lottie/not_found_lottie.json";
import {getUserProjects} from "../services/ProjectService.ts";
import {Project} from "../schemas/projects.ts";

const TasksPage: React.FC = () => {
    // Custom Hooks
    const {t} = useTranslation()
    const alert = useAlert()

    // States
    const [tasks, setTasks] = useState<Task[]>([])
    const [totalItems, setTotalItems] = useState<number>(0)
    const [currentItems, setCurrentItems] = useState<number>(0)
    const [page, setPage] = useState<number>(1)
    const [limit, setLimit] = useState<number>(10)
    const [sort, setSort] = useState<SortOrder>('asc')
    const [totalPages, setTotalPages] = useState<number>(0)
    const [searchTerm, setSearchTerm] = useState<string>('')
    const [selectedCardIds, setSelectedCardIds] = useState<number[]>([])
    const [editMode, setEditMode] = useState(false)
    const [taskToEdit, setTaskToEdit] = useState<Task | null>(null)
    const [projects, setProjects] = useState<Project[]>([])
    const [hasProjects, setHasProjects] = useState<boolean>(true)
    const [projectIdSelected, setProjectIdSelected] = useState<number>(0)


    // Functions
    const toggleModal = () => {
        setEditMode(false)
        setTaskToEdit(null)
        const modal = document.getElementById('modalCreateTask') as HTMLDialogElement
        modal.showModal()
    }

    const openEditModal = (task: Task) => {
        setEditMode(true)
        setTaskToEdit(task)
        const modal = document.getElementById('modalCreateTask') as HTMLDialogElement
        modal.showModal()
    }

    const filteredTasks = tasks.filter((task) =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const onConfirmFunction = (title: string, description: string, projectIdSelected: number) => {
        const taskCreateDto: TaskCreateDto = {
            title,
            description
        }
        createTaskCallback(taskCreateDto, projectIdSelected).then()
    };

    const onEditConfirm = (title: string, description: string, status: TaskStatus) => {
        if (!taskToEdit) return

        const updatedTask = {...taskToEdit, title, description, status}
        updateTaskCallback(updatedTask, taskToEdit.id).then()
        setTasks(prev =>
            prev.map(task => task.id === taskToEdit.id ? updatedTask : task)
        )
    }

    const toggleTaskSelection = (taskId: number) => {
        setSelectedCardIds((prev) =>
            prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
        )
    }

    const handleDeleteSelected = async () => {
        const response: ApiResponse<Task> = await deleteTasks(selectedCardIds)
        if (response.statusCode === 200) {
            getTasksCallbackByParams(limit, page, sort, projectIdSelected).then()
            alert(t('tasks.taskDeletedOk'), 'alert-success')
        } else {
            console.error(response)
            alert(t('tasks.taskDeletedError'), 'alert-error')
        }
        setTasks((prev) => prev.filter(task => !selectedCardIds.includes(task.id)))
        setSelectedCardIds([])
    }


    // Use Callbacks
    const getTasksCallbackByParams = useCallback(async (limit: number, page: number, sort: SortOrder, projectId: number) => {
        const response: ApiResponse<Task> = await getAllTasksByProject(limit, page, sort, projectId)
        if (response.ok && response.statusCode === 200 && response.result) {
            const taskPagination: Pagination<Task> = response.result as Pagination<Task>
            setTasks(taskPagination.items)
            setCurrentItems(taskPagination.items.length)
            setPage(taskPagination.page)
            setLimit(taskPagination.limit)
            setSort(taskPagination.sort)
            setTotalPages(taskPagination.totalPages)
            setTotalItems(taskPagination.totalItems)
        } else {
            alert(response.errors! as string, 'alert-error')
        }
    }, []);

    const updateTaskCallback = useCallback(async (taskUpdateDto: TaskUpdateDto, taskId: number) => {
        const response: ApiResponse<Task> = await updateTask(taskUpdateDto, taskId)
        if (response.statusCode === 200) {
            alert(t('tasks.taskUpdatedOk'), 'alert-success')
        } else {
            alert(t('tasks.taskUpdatedError'), 'alert-error')
        }
    }, []);

    const createTaskCallback = useCallback(async (taskCreateDto: TaskCreateDto, projectId: number) => {
        const response: ApiResponse<Task> = await createTask(taskCreateDto, projectId)
        if (response.statusCode === 201) {
            const taskCreated: Task = response.result as Task
            setTasks(prevTasks => [...prevTasks, taskCreated])
            getTasksCallbackByParams(limit, page, sort, projectId).then()
            alert(t('tasks.taskCreatedOk'), 'alert-success')
        } else {
            alert(t('tasks.taskCreatedError'), 'alert-error')
        }
    }, []);

    const checkUserProjects = useCallback(async () => {
        const response = await getUserProjects(limit, page, sort)
        if (response.ok && response.result) {
            const projectPagination = response.result as Pagination<Project>
            setHasProjects(projectPagination.totalItems > 0)
            setProjects(projectPagination.items)
            if (projectPagination.totalItems > 0) {
                const firstProjectId = projectPagination.items[0].id;
                setProjectIdSelected(firstProjectId);
                await getTasksCallbackByParams(limit, page, sort, firstProjectId);
            }
        } else {
            setHasProjects(false)
        }
    }, [])


    // Use Effects
    useEffect(() => {
        checkUserProjects().then()
        return () => {}
    }, [checkUserProjects]);

    useEffect(() => {
        if (projectIdSelected > 0) {
            getTasksCallbackByParams(limit, page, sort, projectIdSelected).then()
        }

        return () => {}
    }, [limit, page]);

    return (
        <div>
            <h1 className="text-2xl font-bold">{t('tasks.tasks')}</h1>
            <div className="divider"></div>
            <div className="flex flex-1 gap-5 mx-1 justify-between items-center mb-5">
                <div className="flex flex-1 gap-5 justify-start items-center">
                    <label className="input">
                        <MagnifyingGlassIcon className="h-5 w-5"/>
                        <input
                            type="search"
                            className="grow"
                            placeholder={t('tasks.search')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <kbd className="kbd kbd-sm">⌘</kbd>
                        <kbd className="kbd kbd-sm">K</kbd>
                    </label>
                    <AmountItemsComponent setLimit={setLimit} setPage={setPage}/>
                    {selectedCardIds.length > 0 && (
                        <div className="flex justify-start">
                            <button
                                onClick={handleDeleteSelected}
                                className="btn btn-error btn-sm"
                                title={t('tasks.deleteSelected')}
                            >
                                <TrashIcon className="h-4 w-4 mr-1"/>
                                ({selectedCardIds.length})
                            </button>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <fieldset className="fieldset">
                        <select
                            value={projectIdSelected}
                            className="select w-full"
                            disabled={!hasProjects}
                            onChange={(e) => {
                                const selectedId = parseInt(e.target.value)
                                setProjectIdSelected(selectedId)
                                getTasksCallbackByParams(limit, 1, sort, selectedId).then()
                            }}>
                            <option value={0} disabled>{t('tasks.projects')}</option>
                            {projects.map((project) => (
                                <option key={project.id} value={project.id}>
                                    {project.name}
                                </option>
                            ))}
                        </select>
                    </fieldset>
                    <button
                        className="btn btn-primary btn-sm"
                        onClick={toggleModal}
                        disabled={!hasProjects}
                        title={hasProjects ? t('tasks.addTask') : t('tasks.noProjectsToCreate')}
                    >
                        <PlusIcon className="h-5 w-5"/>
                    </button>
                </div>
                <ModalCreateUpdateTask
                    modalTitle={editMode ? t('tasks.editTask') : t('tasks.addTask')}
                    onCreate={!editMode ? onConfirmFunction : undefined}
                    onEdit={editMode ? onEditConfirm : undefined}
                    task={taskToEdit}
                    projects={projects}
                    editMode={editMode}
                />
            </div>
            <div className="flex flex-col gap-4 mx-1">
                <div
                    className="max-h-[calc(100vh-23rem)] overflow-y-auto p-3 border border-base-200 rounded-lg shadow-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {
                            currentItems > 0 ?
                                Array.isArray(tasks) &&
                                filteredTasks.length > 0 ? (filteredTasks.map((task) => (
                                    <TaskCard
                                        key={task.id}
                                        id={task.id}
                                        status={task.status}
                                        projectId={task.projectId}
                                        createdAt={new Date(task.createdAt)}
                                        updatedAt={new Date(task.updatedAt)}
                                        title={task.title}
                                        description={task.description}
                                        selected={selectedCardIds.includes(task.id)}
                                        onToggle={() => toggleTaskSelection(task.id)}
                                        onEdit={() => openEditModal(task)}
                                    />
                                ))) : (
                                    <div className="col-span-full flex justify-center items-center min-h-[200px]">
                                        <Lottie className="h-50 w-50" animationData={notFoundLottie} loop={true}/>
                                    </div>
                                ) : (
                                <div className="col-span-full flex justify-center items-center min-h-[200px]">
                                    <Lottie className="h-50 w-50" animationData={notFoundLottie} loop={true}/>
                                </div>
                            )
                        }
                    </div>
                </div>
                <PaginationComponent
                    page={page}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    currentItems={currentItems}
                    onPageChange={(newPage) => setPage(newPage)}
                    maxVisiblePages={3}
                    label={t('tasks.tasks')}
                />
            </div>
        </div>
    )
}

export default TasksPage