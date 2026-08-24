export interface LoginDto {
    email: string
    password: string
}

export interface TokenResponse {
    token: string
}

export interface CurrentUserMe {
    id: number
    email: string
    role: number
}

export interface AuthProviders {
    google: boolean
}

export interface RegisterDto {
    username: string
    email: string
    password: string
    firstName: string
    lastName: string
}

export interface User {
    id: number
    firstName: string
    lastName: string
    email: string
    username: string
    roleId: number
}

export enum RoleType {
    USER = 'user',
    ADMIN = 'admin',
}

export interface Role {
    id: number
    name: string | RoleType
}
export interface UserResponseDto {
    firstName: string
    lastName: string
    email: string
    username: string
    image: string
    role: string | RoleType
}
