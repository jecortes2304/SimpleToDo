import {apiClient} from './apiClient'
import {AxiosResponse} from 'axios'
import {ApiResponse} from '../schemas/globals.ts'
import {handleApiError, handleApiResponse} from '../utils/apiUtils.ts'
import {LoginDto, RegisterDto, TokenResponse, User} from '../schemas/auth.ts'

export async function login(data: LoginDto): Promise<ApiResponse<TokenResponse>> {
    try {
        const res: AxiosResponse<ApiResponse<TokenResponse>> = await apiClient.post('/auth/login', data).then()
        return handleApiResponse<TokenResponse>(res)
    } catch (error) {
        console.error('Error logging in:', error)
        return handleApiError<TokenResponse>(error as AxiosResponse<ApiResponse<TokenResponse>>)
    }
}

export async function register(data: RegisterDto): Promise<ApiResponse<User>> {
    try {
        const res: AxiosResponse<ApiResponse<User>> = await apiClient.post('/auth/register', data)
        return handleApiResponse<User>(res)
    } catch (error) {
        console.error('Error registering user:', error)
        return handleApiError<User>(error as AxiosResponse<ApiResponse<User>>)
    }
}

export async function logout(): Promise<ApiResponse<null>> {
    try {
        const res: AxiosResponse<ApiResponse<null>> = await apiClient.delete('/auth/logout')
        return handleApiResponse<null>(res)
    } catch (error) {
        console.error('Error logging out:', error)
        return handleApiError<null>(error as AxiosResponse<ApiResponse<null>>)
    }
}
