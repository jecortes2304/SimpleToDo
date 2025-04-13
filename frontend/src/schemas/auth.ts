export interface LoginDto {
    email: string
    password: string
}

export interface TokenResponse {
    token: string
}

export type GenderType = "male" | "female"

export interface RegisterDto {
    username: string
    email: string
    password: string
    phone: string
    firstName: string
    lastName: string
    age: number
    gender: GenderType | string
    birthDate?: string
    address?: string
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
    age: number
    gender: string
    email: string
    phone: string
    username: string
    birthDate: string
    image: string
    address: string
    role: string | RoleType
}
