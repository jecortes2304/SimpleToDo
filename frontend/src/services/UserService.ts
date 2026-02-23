import {apiClient} from './apiClient'
import {ApiResponse, Pagination} from '../schemas/globals'
import {AxiosResponse} from 'axios'
import {handleApiError, handleApiResponse} from '../utils/apiUtils'
import {AISettingsDto, UpdateAISettingsDto, UpdateUserRequestDto, UserResponseDto} from '../schemas/user'


export async function getProfile(): Promise<ApiResponse<UserResponseDto>> {
    try {
        const res: AxiosResponse<ApiResponse<UserResponseDto>> = await apiClient.get('/profile')
        return handleApiResponse(res)
    } catch (error) {
        console.error('Error fetching profile:', error)
        return handleApiError<UserResponseDto>(error as AxiosResponse<ApiResponse<UserResponseDto>>)
    }
}

export async function updateProfile(data: UpdateUserRequestDto): Promise<ApiResponse<UserResponseDto>> {
    try {
        const res: AxiosResponse<ApiResponse<UserResponseDto>> = await apiClient.patch('/profile', data)
        return handleApiResponse(res)
    } catch (error) {
        console.error('Error updating profile:', error)
        return handleApiError<UserResponseDto>(error as AxiosResponse<ApiResponse<UserResponseDto>>)
    }
}

export async function getUserById(id: number): Promise<ApiResponse<UserResponseDto>> {
    try {
        const res: AxiosResponse<ApiResponse<UserResponseDto>> = await apiClient.get(`/users/user/${id}`)
        return handleApiResponse(res)
    } catch (error) {
        console.error('Error fetching user by ID:', error)
        return handleApiError<UserResponseDto>(error as AxiosResponse<ApiResponse<UserResponseDto>>)
    }
}

export async function getAllUsers(
    limit: number,
    page: number,
    sort: string
): Promise<ApiResponse<Pagination<UserResponseDto>>> {
    try {
        const res: AxiosResponse<ApiResponse<Pagination<UserResponseDto>>> =
            await apiClient.get(`/users`, { params: { limit, page, sort } });
        return handleApiResponse(res);
    } catch (error) {
        console.error('Error fetching users:', error);
        return handleApiError<Pagination<UserResponseDto>>(error as AxiosResponse<ApiResponse<Pagination<UserResponseDto>>>);
    }
}

export async function updateUser(id: number, data: UpdateUserRequestDto): Promise<ApiResponse<UserResponseDto>> {
    try {
        const res: AxiosResponse<ApiResponse<UserResponseDto>> = await apiClient.put(`/users/user/${id}`, data)
        return handleApiResponse(res)
    } catch (error) {
        console.error('Error updating user:', error)
        return handleApiError<UserResponseDto>(error as AxiosResponse<ApiResponse<UserResponseDto>>)
    }
}

export async function deleteUser(id: number): Promise<ApiResponse<null>> {
    try {
        const res: AxiosResponse<ApiResponse<null>> = await apiClient.delete(`/users/user/${id}`)
        return handleApiResponse(res)
    } catch (error) {
        console.error('Error deleting user:', error)
        return handleApiError<null>(error as AxiosResponse<ApiResponse<null>>)
    }
}

export async function getAISettings(): Promise<ApiResponse<AISettingsDto>> {
    try {
        const res: AxiosResponse<ApiResponse<AISettingsDto>> = await apiClient.get('/profile/ai-settings')
        return handleApiResponse(res)
    } catch (error) {
        console.error('Error fetching AI settings:', error)
        return handleApiError<AISettingsDto>(error as AxiosResponse<ApiResponse<AISettingsDto>>)
    }
}

export async function updateAISettings(data: UpdateAISettingsDto): Promise<ApiResponse<AISettingsDto>> {
    try {
        const res: AxiosResponse<ApiResponse<AISettingsDto>> = await apiClient.put('/profile/ai-settings', data)
        return handleApiResponse(res)
    } catch (error) {
        console.error('Error updating AI settings:', error)
        return handleApiError<AISettingsDto>(error as AxiosResponse<ApiResponse<AISettingsDto>>)
    }
}