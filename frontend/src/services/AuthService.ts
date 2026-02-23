import {apiClient} from './apiClient'
import {AxiosResponse} from 'axios'
import {ApiResponse} from '../schemas/globals.ts'
import {handleApiError, handleApiResponse} from '../utils/apiUtils.ts'
import {CurrentUserMe, LoginDto, RegisterDto, User} from '../schemas/auth.ts'

export async function login(data: LoginDto): Promise<ApiResponse<null>> {
    try {
        const res: AxiosResponse<ApiResponse<null>> = await apiClient.post('/auth/login', data)
        return handleApiResponse<null>(res)
    } catch (error) {
        console.error('Error logging in:', error)
        return handleApiError<null>(error as AxiosResponse<ApiResponse<null>>)
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

export async function verifyEmail(token: string): Promise<ApiResponse<null>> {
    try {
        const res: AxiosResponse<ApiResponse<null>> = await apiClient.post(`/auth/verify-email?token=${token}`)
        return handleApiResponse<null>(res)
    } catch (error) {
        console.error('Error verifying email:', error)
        return handleApiError<null>(error as AxiosResponse<ApiResponse<null>>)
    }
}

export async function resendVerification(email: string): Promise<ApiResponse<null>> {
    try {
        const res: AxiosResponse<ApiResponse<null>> = await apiClient.post(`/auth/resend-verification`, {email})
        return handleApiResponse<null>(res)
    } catch (error) {
        return handleApiError<null>(error as AxiosResponse<ApiResponse<null>>)
    }
}

export async function resetPassword(token: string, newPassword: string): Promise<ApiResponse<null>> {
    try {
        const res: AxiosResponse<ApiResponse<null>> = await apiClient.post(`/auth/reset`, {
            token,
            newPassword
        })
        return handleApiResponse<null>(res)
    } catch (error) {
        return handleApiError<null>(error as AxiosResponse<ApiResponse<null>>)
    }
}

export async function forgotPassword(email: string): Promise<ApiResponse<null>> {
    try {
        const res = await apiClient.post('/auth/forgot', { email })
        return handleApiResponse<null>(res)
    } catch (error) {
        return handleApiError<null>(error as AxiosResponse<ApiResponse<null>>)
    }
}

export async function getCurrentUser(): Promise<ApiResponse<CurrentUserMe>> {
    try {
        const res: AxiosResponse<ApiResponse<CurrentUserMe>> = await apiClient.get('/auth/me')
        return handleApiResponse<CurrentUserMe>(res)
    } catch (error) {
        return handleApiError<CurrentUserMe>(error as AxiosResponse<ApiResponse<CurrentUserMe>>)
    }
}
