export type UserRole = 'Admin' | 'User'
export interface User {
    id: number
    email: string
    username: string
    firstName: string
    lastName: string
    image: string // base64 string
    role?: UserRole
}

export interface UserResponseDto {
    id: number
    firstName: string
    lastName: string
    email: string
    username: string
    role: string
    image?: string
}

export interface UpdateUserRequestDto {
    firstName?: string
    lastName?: string
    email?: string
    image?: string
}

export interface AdminUpdateUserRequestDto {
    firstName?: string
    lastName?: string
    image?: string
    password?: string
}


export interface AISettingsDto {
    baseUrl: string;
    apiKey: string;
    model: string;
}

export interface UpdateAISettingsDto {
    baseUrl: string;
    apiKey: string;
    model: string;
}

