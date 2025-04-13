import React, {useCallback, useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {createProject, deleteProject, getUserProjects, updateProject} from '../services/ProjectService';
import {CreateProjectDto, Project, UpdateProjectDto} from '../schemas/projects';
import {ApiResponse, Pagination, SortOrder} from '../schemas/globals';
import {MagnifyingGlassIcon, PencilSquareIcon, PlusIcon, TrashIcon} from '@heroicons/react/16/solid';
import PaginationComponent from '../components/PaginationComponent';
import {useAlert} from '../hooks/useAlert';
import Lottie from "lottie-react";
import notFoundLottie from "../assets/lottie/not_found_lottie.json";
import AmountItemsComponent from "../components/AmountItemsComponent.tsx";
import ModalCreateUpdateProject from "../components/ModalCreateUpdateProject.tsx";

const ProjectsPage: React.FC = () => {
    const {t} = useTranslation();
    const alert = useAlert();

    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectIds, setSelectedProjectIds] = useState<number[]>([]);
    const [editMode, setEditMode] = useState(false);
    const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [sort, setSort] = useState<SortOrder>('asc');
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);

    const fetchProjects = useCallback(async () => {
        const response: ApiResponse<Project> = await getUserProjects(limit, page, sort);
        if (response.ok && response.result) {
            const paginated = response.result as Pagination<Project>;
            setProjects(paginated.items);
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
        fetchProjects().then();
    }, [fetchProjects]);


    const onConfirmFunction = (name: string, description: string) => {
        if (editMode && projectToEdit) {
            setProjectToEdit(prevState => {
                if (prevState) {
                    return {
                        ...prevState,
                        name: name,
                        description: description
                    }
                }
                return null;
            })

            const updatedProject: UpdateProjectDto = {
                id: projectToEdit.id,
                name: name,
                description: description
            }
            handleUpdateCallback(updatedProject).then()
        } else {
            const newProject: CreateProjectDto = {
                name: name,
                description: description
            }
            handleCreateCallback(newProject).then()
        }

    };

    const handleUpdateCallback = useCallback(async (updatedProject: UpdateProjectDto) => {
        const response = await updateProject(updatedProject.id, updatedProject);
        if (response.statusCode === 200) {
            alert(t('projects.updated'), 'alert-success');
            await fetchProjects();
        } else {
            alert(response.errors as string, 'alert-error');
        }
    }, []);

    const handleCreateCallback = useCallback(async (newProject: CreateProjectDto) => {
        const response = await createProject(newProject);
        if (response.statusCode === 201) {
            alert(t('projects.created'), 'alert-success');
            await fetchProjects();
        } else {
            alert(response.errors as string, 'alert-error');
        }
    }, []);

    const handleDeleteCallback = useCallback(async (id: number) => {
        const response = await deleteProject(id);
        if (response.statusCode === 200) {
            alert(t('projects.deleted'), 'alert-success');
            await fetchProjects();
        } else {
            alert(response.errors as string, 'alert-error');
        }
    }, []);

    const openEditModal = (project: Project) => {
        setEditMode(true)
        setProjectToEdit(project)
        const modal = document.getElementById('modalCreateProject') as HTMLDialogElement
        modal.showModal()
    }

    const toggleModal = () => {
        setEditMode(false)
        setProjectToEdit(null)
        const modal = document.getElementById('modalCreateProject') as HTMLDialogElement
        modal.showModal()
    }

    const handleDeleteSelected = async () => {
        await Promise.all(selectedProjectIds.map(id => deleteProject(id)));
        alert(t('projects.deletedMultiple'), 'alert-success');
        await fetchProjects();
        setSelectedProjectIds([]);
    };

    const toggleSelection = (id: number) => {
        setSelectedProjectIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const filteredProjects = projects.filter(project =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">{t('projects.projects')}</h1>

            <div className="flex gap-4 mb-4 flex-wrap items-center">
                <label className="input">
                    <MagnifyingGlassIcon className="h-5 w-5"/>
                    <input
                        type="search"
                        className="grow"
                        placeholder={t('projects.search')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </label>
                <button className="btn btn-primary btn-sm" onClick={toggleModal}>
                    <PlusIcon title={t('projects.create')} className="h-4 w-4 mr-1"/>
                </button>
                <AmountItemsComponent setPage={setPage} setLimit={setLimit}/>
                {selectedProjectIds.length > 0 && (
                    <button className="btn btn-error" onClick={handleDeleteSelected}>
                        <TrashIcon title={t('projects.deleteSelected')}
                                   className="h-4 w-4 mr-1"/> ({selectedProjectIds.length})
                    </button>
                )}
            </div>
            <ModalCreateUpdateProject
                project={projectToEdit!}
                editMode={editMode}
                modalTitle={editMode ? t('projects.update') : t('projects.create')}
                onCreateOrUpdate={onConfirmFunction}
            />
            <div className="overflow-x-auto">
                <table className="table">
                    <thead>
                    <tr>
                        <th></th>
                        <th>{t('projects.name')}</th>
                        <th>{t('projects.description')}</th>
                        <th>{t('projects.createdAt')}</th>
                        <th>{t('projects.updatedAt')}</th>
                        <th>{t('projects.actions')}</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredProjects.length > 0 ? (
                        filteredProjects.map((project, idx) => (
                            <tr key={project.id} className={idx % 2 === 0 ? 'bg-base-200' : ''}>
                                <td>
                                    <input
                                        type="checkbox"
                                        checked={selectedProjectIds.includes(project.id)}
                                        onChange={() => toggleSelection(project.id)}
                                        className="checkbox checkbox-sm"
                                    />
                                </td>
                                <td>{project.name}</td>
                                <td>{project.description}</td>
                                <td>{new Date(project.createdAt).toLocaleString()}</td>
                                <td>{new Date(project.updatedAt).toLocaleString()}</td>
                                <td>
                                    <button
                                        className="btn btn-sm btn-outline btn-info mr-2"
                                        onClick={() => openEditModal(project)}
                                    >
                                        <PencilSquareIcon className="h-4 w-4"/>
                                    </button>
                                    <button
                                        className="btn btn-sm btn-outline btn-error"
                                        onClick={() => handleDeleteCallback(project.id)}
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
                currentItems={filteredProjects.length}
                onPageChange={setPage}
                maxVisiblePages={5}
                label={t('projects.projects')}
            />
        </div>
    );
}

export default ProjectsPage;
