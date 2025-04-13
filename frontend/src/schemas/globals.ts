export enum ThemeColor {
    LIGHT = 'light',
    DARK = 'dark'
}

export type SortOrder = 'asc' | 'desc'

export interface Pagination<T> {
    limit: number
    page: number
    sort: SortOrder
    totalItems: number
    totalPages: number
    items: T[]
}

export interface StandardResponse {
    statusCode: number | string
    statusMessage: string
}

export interface ApiResponse<T> extends StandardResponse {
    ok: boolean
    result?: Pagination<T> | T | null
    errors?: string | string[] | null
}
