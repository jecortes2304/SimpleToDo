import {TaskStatus} from "./tasks.ts";

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


export const STORAGE_KEYS = {
    TASKS_COLUMN_ORDER: "tasks.columnOrder",
    TASKS_SELECTED_PROJECT: "tasks.selectedProject",
    TASKS_LIMIT: "tasks.limit",
    PAGE: "tasks.page",
    SORT: "tasks.sort",
    TASKS_TOTAL_PAGES: "tasks.totalPages",
    TASKS_TOTAL_ITEMS: "tasks.totalItems",
};

export const DEFAULT_COLUMN_ORDER: TaskStatus[] = [
    "pending",
    "ongoing",
    "blocked",
    "cancelled",
    "completed",
];