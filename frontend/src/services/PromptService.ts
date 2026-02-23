import {apiClient} from './apiClient';
import {AxiosResponse} from 'axios';
import {CreatePromptDto, Prompt, UpdatePromptDto} from '../schemas/prompts';
import {ApiResponse, SortOrder} from '../schemas/globals';
import {handleApiError, handleApiResponse} from '../utils/apiUtils';

export async function getPrompts(limit: number, page: number, sort: SortOrder): Promise<ApiResponse<Prompt>> {
    try {
        const res: AxiosResponse<ApiResponse<Prompt>> = await apiClient.get('/prompts', {
            params: { limit, page, sort },
        });
        return handleApiResponse<Prompt>(res);
    } catch (err) {
        console.error("Error getting prompts:", err);
        return handleApiError<Prompt>(err as AxiosResponse<ApiResponse<Prompt>>)
    }
}

export async function getPromptById(id: number): Promise<ApiResponse<Prompt>> {
    try {
        const res: AxiosResponse<ApiResponse<Prompt>> = await apiClient.get(`/prompts/${id}`);
        return handleApiResponse<Prompt>(res);
    } catch (err) {
        console.error("Error getting prompt by ID:", err);
        return handleApiError<Prompt>(err as AxiosResponse<ApiResponse<Prompt>>)
    }
}

export async function createPrompt(data: CreatePromptDto): Promise<ApiResponse<Prompt>> {
    try {
        const res: AxiosResponse<ApiResponse<Prompt>> = await apiClient.post('/prompts', data);
        return handleApiResponse<Prompt>(res);
    } catch (err) {
        console.error("Error creating prompt:", err);
        return handleApiError<Prompt>(err as AxiosResponse<ApiResponse<Prompt>>)
    }
}

export async function updatePrompt(id: number, data: UpdatePromptDto): Promise<ApiResponse<Prompt>> {
    try {
        const res: AxiosResponse<ApiResponse<Prompt>> = await apiClient.put(`/prompts/${id}`, data);
        return handleApiResponse<Prompt>(res);
    } catch (err) {
        console.error("Error updating prompt:", err);
        return handleApiError<Prompt>(err as AxiosResponse<ApiResponse<Prompt>>)
    }
}

export async function deletePrompt(id: number): Promise<ApiResponse<null>> {
    try {
        const res: AxiosResponse<ApiResponse<null>> = await apiClient.delete(`/prompts/${id}`);
        return handleApiResponse<null>(res);
    } catch (err) {
        console.error("Error deleting prompt:", err);
        return handleApiError<null>(err as AxiosResponse<ApiResponse<null>>)
    }
}