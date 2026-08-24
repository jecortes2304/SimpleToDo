import {apiClient} from './api-client'
import {Task, TaskCreateDto, TaskUpdateDto} from "../schemas/task.ts";
import {ApiResponse, SortOrder} from "../schemas/global.ts";
import {AxiosResponse} from "axios";
import {handleApiError, handleApiResponse} from "../utils/api-utils.ts";
import {dedupeRequest} from "../utils/request-utils.ts";


export function getAllTasksByProject(
    limit: number,
    page: number,
    sort: SortOrder,
    projectId: number,
    taskTitle?: string
): Promise<ApiResponse<Task>> {
    const normalizedTitle = taskTitle?.trim() ?? '';
    return dedupeRequest(`tasks:${projectId}:${limit}:${page}:${sort}:${normalizedTitle}`, async () => {
        try {
            const res: AxiosResponse<ApiResponse<Task>> = await apiClient.get<ApiResponse<Task>>(`/tasks/${projectId}`, {
                params: {
                    limit,
                    page,
                    sort,
                    taskTitle: normalizedTitle || undefined,
                },
            })
            return handleApiResponse<Task>(res)
        } catch (error) {
            console.error('Error fetching tasks:', error)
            return handleApiError<Task>(error as AxiosResponse<ApiResponse<Task>>)
        }
    });
}

export async function createTask(taskCreateDto: TaskCreateDto, projectId: number): Promise<ApiResponse<Task>> {
    try {
        const res: AxiosResponse<ApiResponse<Task>> = await apiClient.post<ApiResponse<Task>>(`/tasks/task/${projectId}`, {
            ...taskCreateDto
        })
        return handleApiResponse<Task>(res)
    } catch (error) {
        console.error('Error creating task:', error)
        return handleApiError<Task>(error as AxiosResponse<ApiResponse<Task>>)
    }
}

export async function updateTask(taskUpdateDto: TaskUpdateDto, taskId: number): Promise<ApiResponse<Task>> {
    try {
        const res: AxiosResponse<ApiResponse<Task>> = await apiClient.put<ApiResponse<Task>>(`/tasks/task/${taskId}`, {
            ...taskUpdateDto
        })
        return handleApiResponse<Task>(res)
    } catch (error) {
        console.error('Error creating task:', error)
        return handleApiError<Task>(error as AxiosResponse<ApiResponse<Task>>)
    }
}

export async function deleteTasks(tasksIds : number []): Promise<ApiResponse<Task>> {
    try {
        const res: AxiosResponse<ApiResponse<Task>> = await apiClient.delete<ApiResponse<Task>>(`/tasks?`, {
            params: {
                ids: tasksIds.join(','),
            },
        })
        return handleApiResponse<Task>(res)
    } catch (error) {
        console.error('Error deleting tasks:', error)
        return handleApiError<Task>(error as AxiosResponse<ApiResponse<Task>>)
    }
}
