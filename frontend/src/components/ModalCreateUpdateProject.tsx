import React, {useEffect, useState} from 'react'
import {useTranslation} from "react-i18next";
import {ChatBubbleLeftIcon, DocumentTextIcon} from "@heroicons/react/16/solid";
import {useAlert} from "../hooks/useAlert.ts";
import {Project} from "../schemas/projects.ts";

interface ModalCreateUpdateProjectProps {
    modalTitle: string
    project: Project
    editMode?: boolean
    onCreateOrUpdate: (title: string, description: string) => void
}

const ModalCreateUpdateProject: React.FC<ModalCreateUpdateProjectProps> = ({modalTitle, onCreateOrUpdate, project, editMode}) => {
    const [name, setName] = useState<string>('')
    const [description, setDescription] = useState<string>('')
    const [error, setError] = useState<boolean>(false)
    const {t} = useTranslation()
    const alert = useAlert()

    const handleOk = () => {
        if (!name || !description) {
            alert(t('tasks.fieldsRequired'), 'alert-error')
            return
        }
        if (onCreateOrUpdate) {
            onCreateOrUpdate(name, description)
        }

        closeModal()
    }

    const cleanFields = () => {
        setName('')
        setDescription('')
    }

    const closeModal = () => {
        const modal = document.getElementById('modalCreateProject') as HTMLDialogElement
        modal?.close()

        // Delay clearing to avoid flashing red fields
        setTimeout(() => {
            cleanFields()
        }, 150)
    }


    useEffect(() => {
        if (name.length < 5 || name.length > 100) {
            setError(true)
        }
        if (description.length < 10 || description.length > 300) {
            setError(true)
        }
        if (name.length >= 5 && name.length <= 100 && description.length >= 10 && description.length <= 300) {
            setError(false)
        }
    }, [name, description]);

    useEffect(() => {
        if (editMode && project) {
            setName(project.name)
            setDescription(project.description)
        } else {
            setName('')
            setDescription('')
        }
    }, [editMode, project])


    return (
        <dialog id="modalCreateProject" className="modal">
            <div className="modal-box">
                <h3 className="font-bold text-lg mb-5">{modalTitle}</h3>

                <div className="form-control mb-4 flex flex-col w-full">
                    <label className="label mb-2">
                        <span className="label-text">{t('tasks.title')}</span>
                    </label>
                    <label className="input validator w-full">
                        <ChatBubbleLeftIcon className="h-[1em] opacity-50"/>
                        <input
                            onChange={(e) => setName(e.target.value)}
                            type="input"
                            required
                            placeholder={t('tasks.titlePlaceHolder')}
                            minLength={5}
                            maxLength={100}
                            value={name}
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

export default ModalCreateUpdateProject
