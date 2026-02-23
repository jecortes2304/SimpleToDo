import React, {useEffect, useState} from 'react'
import {useTranslation} from "react-i18next";
import {ChatBubbleLeftIcon, CommandLineIcon, DocumentTextIcon} from "@heroicons/react/16/solid";
import {useAlert} from "../hooks/useAlert.ts";
import {Prompt} from "../schemas/prompts.ts";

interface ModalCreateUpdatePromptProps {
    modalTitle: string
    prompt: Prompt | null
    editMode?: boolean
    onCreateOrUpdate: (title: string, description: string, systemPrompt: string) => void
}

const ModalCreateUpdatePrompt: React.FC<ModalCreateUpdatePromptProps> = ({modalTitle, onCreateOrUpdate, prompt, editMode}) => {
    const [title, setTitle] = useState<string>('')
    const [description, setDescription] = useState<string>('')
    const [systemPrompt, setSystemPrompt] = useState<string>('')
    const [error, setError] = useState<boolean>(false)
    const {t} = useTranslation()
    const alert = useAlert()

    const handleOk = () => {
        if (!title || !description || !systemPrompt) {
            alert(t('auth.fieldsRequired'), 'alert-error')
            return
        }
        if (onCreateOrUpdate) {
            onCreateOrUpdate(title, description, systemPrompt)
        }

        closeModal()
    }

    const cleanFields = () => {
        setTitle('')
        setDescription('')
        setSystemPrompt('')
    }

    const closeModal = () => {
        const modal = document.getElementById('modalCreatePrompt') as HTMLDialogElement
        modal?.close()

        setTimeout(() => {
            cleanFields()
        }, 150)
    }

    useEffect(() => {
        let isError = false
        if (title.length < 5 || title.length > 100) isError = true
        if (description.length < 10 || description.length > 300) isError = true
        if (systemPrompt.length < 10) isError = true

        setError(isError)
    }, [title, description, systemPrompt]);

    useEffect(() => {
        if (editMode && prompt) {
            setTitle(prompt.title)
            setDescription(prompt.description)
            setSystemPrompt(prompt.systemPrompt)
        } else {
            setTitle('')
            setDescription('')
            setSystemPrompt('')
        }
    }, [editMode, prompt])

    return (
        <dialog id="modalCreatePrompt" className="modal">
            <div className="modal-box">
                <h3 className="font-bold text-lg mb-5">{modalTitle}</h3>

                <div className="form-control mb-4 flex flex-col w-full">
                    <label className="label mb-2">
                        <span className="label-text">{t('prompts.title')}</span>
                    </label>
                    <label className="input validator w-full">
                        <ChatBubbleLeftIcon className="h-[1em] opacity-50"/>
                        <input
                            onChange={(e) => setTitle(e.target.value)}
                            type="input"
                            required
                            placeholder={t('prompts.titlePlaceholder')}
                            minLength={5}
                            maxLength={100}
                            value={title}
                            title={t('prompts.titleHint')}/>
                    </label>
                    <p className="validator-hint">
                        {t('prompts.titleHint')}
                    </p>
                </div>

                <div className="form-control mb-6 flex flex-col w-full">
                    <label className="label mb-2">
                        <span className="label-text">{t('prompts.description')}</span>
                    </label>
                    <label className="input validator w-full">
                        <DocumentTextIcon className="h-[1em] opacity-50"/>
                        <input
                            onChange={(e) => setDescription(e.target.value)}
                            required
                            type="input"
                            className="w-full"
                            placeholder={t('prompts.descriptionPlaceholder')}
                            minLength={10}
                            maxLength={300}
                            value={description}
                            title={t('prompts.descriptionHint')}/>
                    </label>
                    <p className="validator-hint">
                        {t('prompts.descriptionHint')}
                    </p>
                </div>

                <div className="form-control mb-6 flex flex-col w-full">
                    <label className="label mb-2">
                        <span className="label-text">{t('prompts.systemPrompt')}</span>
                    </label>
                    <label className="textarea validator w-full">
                        <CommandLineIcon className="h-[1em] opacity-50"/>
                        <textarea
                            onChange={(e) => setSystemPrompt(e.target.value)}
                            required
                            className="textarea textarea-ghost w-full h-32"
                            placeholder={t('prompts.systemPromptPlaceholder')}
                            minLength={10}
                            value={systemPrompt}
                            title={t('auth.fieldsRequired')}/>
                    </label>
                    <p className="validator-hint">
                        {t('auth.fieldsRequired')} (Min 10 chars)
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

export default ModalCreateUpdatePrompt