export type UserRole = 'Admin' | 'User'
export interface User {
    id: number
    email: string
    username: string
    firstName: string
    lastName: string
    phone: string
    image: string // base64 string
    role?: UserRole
    address?: string
}

export interface UserResponseDto {
    id: number
    firstName: string
    lastName: string
    email: string
    phone: string
    username: string
    role: string
    image?: string
}

export interface UpdateUserRequestDto {
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
    image?: string
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

