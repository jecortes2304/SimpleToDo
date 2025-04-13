import {apiClient} from './apiClient';
import {AxiosResponse} from 'axios';
import {CreateProjectDto, Project, UpdateProjectDto} from '../schemas/projects';
import {ApiResponse, SortOrder} from '../schemas/globals';
import {handleApiError, handleApiResponse} from '../utils/apiUtils';

export async function getUserProjects(limit: number, page: number, sort: SortOrder): Promise<ApiResponse<Project>> {
    try {
        const res: AxiosResponse<ApiResponse<Project>> = await apiClient.get('/projects/user', {
            params: { limit, page, sort },
        });
        return handleApiResponse<Project>(res);
    } catch (err) {
        console.error("Error getting user projects:", err);
        return handleApiError<Project>(err as AxiosResponse<ApiResponse<Project>>)
    }
}

export async function getAllProjects(limit: number, page: number, sort: SortOrder): Promise<ApiResponse<Project>> {
    try {
        const res: AxiosResponse<ApiResponse<Project>> = await apiClient.get('/projects', {
            params: { limit, page, sort },
        });
        return handleApiResponse<Project>(res);
    } catch (err) {
        console.error("Error getting all projects:", err);
        return handleApiError<Project>(err as AxiosResponse<ApiResponse<Project>>)
    }
}

export async function getProjectById(id: number): Promise<ApiResponse<Project>> {
    try {
        const res: AxiosResponse<ApiResponse<Project>> = await apiClient.get(`/projects/project/${id}`);
        return handleApiResponse<Project>(res);
    } catch (err) {
        console.error("Error getting project by ID:", err);
        return handleApiError<Project>(err as AxiosResponse<ApiResponse<Project>>)
    }
}

export async function createProject(data: CreateProjectDto): Promise<ApiResponse<Project>> {
    try {
        const res: AxiosResponse<ApiResponse<Project>> = await apiClient.post('/projects/project', data);
        return handleApiResponse<Project>(res);
    } catch (err) {
        console.error("Error creating project:", err);
        return handleApiError<Project>(err as AxiosResponse<ApiResponse<Project>>)
    }
}

export async function updateProject(id: number, data: UpdateProjectDto): Promise<ApiResponse<Project>> {
    try {
        const res: AxiosResponse<ApiResponse<Project>> = await apiClient.put(`/projects/project/${id}`, data);
        return handleApiResponse<Project>(res);
    } catch (err) {
        console.error("Error updating project:", err);
        return handleApiError<Project>(err as AxiosResponse<ApiResponse<Project>>)
    }
}

export async function deleteProject(id: number): Promise<ApiResponse<null>> {
    try {
        const res: AxiosResponse<ApiResponse<null>> = await apiClient.delete(`/projects/project/${id}`);
        return handleApiResponse<null>(res);
    } catch (err) {
        console.error("Error deleting project:", err);
        return handleApiError<null>(err as AxiosResponse<ApiResponse<null>>)
    }
}
