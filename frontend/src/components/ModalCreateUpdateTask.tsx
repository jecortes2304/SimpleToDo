import React, {useEffect, useState} from 'react'
import {useTranslation} from "react-i18next";
import {
    ChatBubbleLeftIcon,
    CheckCircleIcon,
    ClockIcon,
    DocumentTextIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
    ShieldExclamationIcon
} from "@heroicons/react/16/solid";
import {useAlert} from "../hooks/useAlert.ts";
import {Task, TaskStatus} from "../schemas/tasks.ts";
import {Project} from "../schemas/projects.ts";

interface ModalCreateTaskProps {
    modalTitle: string
    task?: Task | null
    projects: Project[]
    editMode?: boolean
    onCreate?: (title: string, description: string, projectIdSelected: number) => void
    onEdit?: (title: string, description: string, status: TaskStatus) => void
}

const ModalCreateUpdateTask: React.FC<ModalCreateTaskProps> = ({modalTitle, onCreate, onEdit,  task, projects, editMode}) => {
    const [title, setTitle] = useState<string>('')
    const [description, setDescription] = useState<string>('')
    const [status, setStatus] = useState<TaskStatus>(task ? task.status : 'pending')
    const [error, setError] = useState<boolean>(false)
    const [projectIdSelected, setProjectIdSelected] = useState<number>(0)
    const {t} = useTranslation()
    const alert = useAlert()

    const handleOk = () => {
        if (!title || !description) {
            alert(t('tasks.fieldsRequired'), 'alert-error')
            return
        }
        if (onEdit && editMode) {
            onEdit(title, description, status)
        } else if (onCreate && !editMode) {
            onCreate(title, description, projectIdSelected)
        }

        closeModal()
    }

    const cleanFields = () => {
        setTitle('')
        setDescription('')
    }

    const formatStatus = (status: string) => {
        const translated = t(`tasks.status.${status}`);
        return translated.charAt(0).toUpperCase() + translated.slice(1);
    };

    const closeModal = () => {
        const modal = document.getElementById('modalCreateTask') as HTMLDialogElement
        modal?.close()

        // Delay clearing to avoid flashing red fields
        setTimeout(() => {
            cleanFields()
        }, 150)
    }


    useEffect(() => {
        if (title.length < 5 || title.length > 100) {
            setError(true)
        }
        if (description.length < 10 || description.length > 300) {
            setError(true)
        }
        if (title.length >= 5 && title.length <= 100 && description.length >= 10 && description.length <= 300) {
            setError(false)
        }
    }, [title, description]);

    useEffect(() => {
        if (editMode && task) {
            setTitle(task.title)
            setDescription(task.description)
            setStatus(task.status)
        } else {
            setTitle('')
            setDescription('')
        }
    }, [editMode, task])

    useEffect(() => {
        if (!editMode && projects.length > 0) {
            setProjectIdSelected(projects[0].id);
        }
    }, [editMode, projects]);


    return (
        <dialog id="modalCreateTask" className="modal">
            <div className="modal-box">
                <h3 className="font-bold text-lg mb-5">{modalTitle}</h3>

                <div className="form-control mb-4 flex flex-col w-full">

                    <fieldset className="fieldset mb-5">
                        <legend className="fieldset-legend">{t('tasks.projects')}</legend>
                        <select
                            defaultValue="Pick a project"
                            className="select w-full"
                            onChange={(e) => {
                                setProjectIdSelected(parseInt(e.target.value))
                            }}>

                            <option disabled={true}>{t('tasks.projects')}</option>
                            {projects.map((project) => (
                                <option key={project.id} value={project.id}>
                                    {project.name}
                                </option>
                            ))}
                        </select>
                    </fieldset>

                    <label className="label mb-2">
                        <span className="label-text">{t('tasks.title')}</span>
                    </label>
                    <label className="input validator w-full">
                        <ChatBubbleLeftIcon className="h-[1em] opacity-50"/>
                        <input
                            onChange={(e) => setTitle(e.target.value)}
                            type="input"
                            required
                            placeholder={t('tasks.titlePlaceHolder')}
                            minLength={5}
                            maxLength={100}
                            value={title}
                            title={t('tasks.titleHint')}/>
                    </label>
                    <p className="validator-hint">
                        {t('tasks.titleHint')}
                    </p>
                </div>

                <div className="form-control mb-6 flex flex-col w-full">
                    <label className="label mb-2">
                        <span className="label-text">{t('tasks.description')}</span>
                    </label>
                    <label className="textarea validator w-full">
                        <DocumentTextIcon className="h-[1em] opacity-50"/>
                        <textarea
                            onChange={(e) => setDescription(e.target.value)}
                            required
                            className="textarea textarea-ghost w-full"
                            placeholder={t('tasks.descriptionPlaceholder')}
                            minLength={10}
                            maxLength={300}
                            value={description}
                            title={t('tasks.descriptionHint')}/>
                    </label>
                    <p className="validator-hint">
                        {t('tasks.descriptionHint')}
                    </p>
                </div>

                {editMode && (
                    <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                        <div
                            className={`cursor-pointer badge badge-primary ${status === 'pending' ? 'badge-outline badge-lg' : 'badge-sm'}`}
                            onClick={() => setStatus('pending')}>
                            <ClockIcon className="h-3"/>
                            {formatStatus("pending")}
                        </div>
                        <div
                            className={`cursor-pointer badge badge-info ${status === 'ongoing' ? 'badge-outline badge-lg' : 'badge-sm'}`}
                            onClick={() => setStatus('ongoing')}>
                            <InformationCircleIcon className="h-3"/>
                            {formatStatus("ongoing")}
                        </div>
                        <div
                            className={`cursor-pointer badge badge-success ${status === 'completed' ? 'badge-outline badge-lg' : 'badge-sm'}`}
                            onClick={() => setStatus('completed')}>
                            <CheckCircleIcon className="h-3"/>
                            {formatStatus("completed")}
                        </div>
                        <div
                            className={`cursor-pointer badge badge-warning ${status === 'cancelled' ? 'badge-outline badge-lg' : 'badge-sm'}`}
                            onClick={() => setStatus('cancelled')}>
                            <ExclamationTriangleIcon className="h-3"/>
                            {formatStatus("cancelled")}
                        </div>
                        <div
                            className={`cursor-pointer badge badge-error ${status === 'blocked' ? 'badge-outline badge-lg' : 'badge-sm'}`}
                            onClick={() => setStatus('blocked')}>
                            <ShieldExclamationIcon className="h-3"/>
                            {formatStatus("blocked")}
                        </div>
                    </div>
                )}

                <div className="modal-action">
                    <button type="button" className="btn btn-outline" onClick={closeModal}>
                        {t('tasks.cancel')}
                    </button>
                    <button type="button" className={`btn btn-primary ${error && 'btn-disabled'}`} onClick={handleOk}>
                        OK
                    </button>
                </div>
            </div>
        </dialog>
    )
}

export default ModalCreateUpdateTask
