import React, {useCallback, useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {createPrompt, deletePrompt, getPrompts, updatePrompt} from '../services/PromptService';
import {CreatePromptDto, Prompt, UpdatePromptDto} from '../schemas/prompts';
import {ApiResponse, Pagination, SortOrder} from '../schemas/globals';
import {MagnifyingGlassIcon, PencilSquareIcon, PlusIcon, TrashIcon} from '@heroicons/react/16/solid';
import PaginationComponent from '../components/PaginationComponent';
import {useAlert} from '../hooks/useAlert';
import Lottie from "lottie-react";
import notFoundLottie from "../assets/lottie/not_found_lottie.json";
import AmountItemsComponent from "../components/AmountItemsComponent.tsx";
import ModalCreateUpdatePrompt from "../components/ModalCreateUpdatePrompt.tsx";

const PromptsPage: React.FC = () => {
    const {t} = useTranslation();
    const alert = useAlert();

    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [selectedPromptIds, setSelectedPromptIds] = useState<number[]>([]);
    const [editMode, setEditMode] = useState(false);
    const [promptToEdit, setPromptToEdit] = useState<Prompt | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [sort, setSort] = useState<SortOrder>('asc');
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);

    const fetchPrompts = useCallback(async () => {
        const response: ApiResponse<Prompt> = await getPrompts(limit, page, sort);
        if (response.ok && response.result) {
            const paginated = response.result as Pagination<Prompt>;
            setPrompts(paginated.items);
            setPage(paginated.page)
            setLimit(paginated.limit)
            setSort(paginated.sort)
            setTotalPages(paginated.totalPages)
            setTotalItems(paginated.totalItems)
        } else {
            alert(response.errors as string, 'alert-error');
        }
    }, [limit, page, sort]);

    useEffect(() => {
        fetchPrompts().then();
    }, [fetchPrompts]);


    const onConfirmFunction = (title: string, description: string, systemPrompt: string) => {
        if (editMode && promptToEdit) {
            setPromptToEdit(prevState => {
                if (prevState) {
                    return {
                        ...prevState,
                        title: title,
                        description: description,
                        systemPrompt: systemPrompt
                    }
                }
                return null;
            })

            const updatedPrompt: UpdatePromptDto = {
                title: title,
                description: description,
                systemPrompt: systemPrompt
            }
            handleUpdateCallback(promptToEdit.id, updatedPrompt).then()
        } else {
            const newPrompt: CreatePromptDto = {
                title: title,
                description: description,
                systemPrompt: systemPrompt
            }
            handleCreateCallback(newPrompt).then()
        }
    };

    const handleUpdateCallback = useCallback(async (id: number, updatedPrompt: UpdatePromptDto) => {
        const response = await updatePrompt(id, updatedPrompt);
        if (response.statusCode === 200) {
            alert(t('prompts.updated'), 'alert-success');
            await fetchPrompts();
        } else {
            alert(response.errors as string, 'alert-error');
        }
    }, []);

    const handleCreateCallback = useCallback(async (newPrompt: CreatePromptDto) => {
        const response = await createPrompt(newPrompt);
        if (response.statusCode === 201) {
            alert(t('prompts.created'), 'alert-success');
            await fetchPrompts();
        } else {
            alert(response.errors as string, 'alert-error');
        }
    }, []);

    const handleDeleteCallback = useCallback(async (id: number) => {
        const response = await deletePrompt(id);
        if (response.statusCode === 200) {
            alert(t('prompts.deleted'), 'alert-success');
            await fetchPrompts();
        } else {
            alert(response.errors as string, 'alert-error');
        }
    }, []);

    const openEditModal = (prompt: Prompt) => {
        setEditMode(true)
        setPromptToEdit(prompt)
        const modal = document.getElementById('modalCreatePrompt') as HTMLDialogElement
        modal.showModal()
    }

    const toggleModal = () => {
        setEditMode(false)
        setPromptToEdit(null)
        const modal = document.getElementById('modalCreatePrompt') as HTMLDialogElement
        modal.showModal()
    }

    const handleDeleteSelected = async () => {
        await Promise.all(selectedPromptIds.map(id => deletePrompt(id)));
        alert(t('prompts.deletedMultiple'), 'alert-success');
        await fetchPrompts();
        setSelectedPromptIds([]);
    };

    const toggleSelection = (id: number) => {
        setSelectedPromptIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const filteredPrompts = prompts.filter(prompt =>
        prompt.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">{t('prompts.prompts')}</h1>

            <div className="flex gap-4 mb-4 flex-wrap items-center">
                <label className="input">
                    <MagnifyingGlassIcon className="h-5 w-5"/>
                    <input
                        type="search"
                        className="grow"
                        placeholder={t('prompts.search')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </label>
                <button className="btn btn-primary btn-sm" onClick={toggleModal}>
                    <PlusIcon title={t('prompts.create')} className="h-4 w-4 mr-1"/>
                </button>
                <AmountItemsComponent setPage={setPage} setLimit={setLimit}/>
                {selectedPromptIds.length > 0 && (
                    <button className="btn btn-error" onClick={handleDeleteSelected}>
                        <TrashIcon title={t('prompts.deleteSelected')}
                                   className="h-4 w-4 mr-1"/> ({selectedPromptIds.length})
                    </button>
                )}
            </div>
            <ModalCreateUpdatePrompt
                prompt={promptToEdit!}
                editMode={editMode}
                modalTitle={editMode ? t('prompts.update') : t('prompts.create')}
                onCreateOrUpdate={onConfirmFunction}
            />
            <div className="overflow-x-auto">
                <table className="table">
                    <thead>
                    <tr>
                        <th></th>
                        <th>{t('prompts.title')}</th>
                        <th>{t('prompts.description')}</th>
                        <th className="hidden md:table-cell">{t('prompts.systemPromptShort')}</th>
                        <th>{t('prompts.createdAt')}</th>
                        <th>{t('prompts.updateAt')}</th>
                        <th>{t('prompts.actions')}</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredPrompts.length > 0 ? (
                        filteredPrompts.map((prompt, idx) => (
                            <tr key={prompt.id} className={idx % 2 === 0 ? 'bg-base-200' : ''}>
                                <td>
                                    <input
                                        type="checkbox"
                                        checked={selectedPromptIds.includes(prompt.id)}
                                        onChange={() => toggleSelection(prompt.id)}
                                        className="checkbox checkbox-sm"
                                    />
                                </td>
                                <td className="font-bold">{prompt.title}</td>
                                <td>{prompt.description.length > 30 ? prompt.description.substring(0, 30) + '...' : prompt.description}</td>
                                <td className="hidden md:table-cell max-w-xs truncate" title={prompt.systemPrompt}>
                                    {prompt.systemPrompt.length > 30 ? prompt.systemPrompt.substring(0, 30) + '...' : prompt.systemPrompt}
                                </td>
                                <td>{new Date(prompt.createdAt).toLocaleString()}</td>
                                <td>{new Date(prompt.updatedAt).toLocaleString()}</td>
                                <td>
                                    <button
                                        className="btn btn-sm btn-outline btn-info mr-2"
                                        onClick={() => openEditModal(prompt)}
                                    >
                                        <PencilSquareIcon className="h-4 w-4"/>
                                    </button>
                                    <button
                                        className="btn btn-sm btn-outline btn-error"
                                        onClick={() => handleDeleteCallback(prompt.id)}
                                    >
                                        <TrashIcon className="h-4 w-4"/>
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={6}>
                                <div className="flex justify-center items-center min-h-[200px]">
                                    <Lottie className="h-50 w-50" animationData={notFoundLottie} loop={true}/>
                                </div>
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>

            <PaginationComponent
                page={page}
                totalPages={totalPages}
                totalItems={totalItems}
                currentItems={filteredPrompts.length}
                onPageChange={setPage}
                maxVisiblePages={5}
                label={t('prompts.prompts')}
            />
        </div>
    );
}

export default PromptsPage;