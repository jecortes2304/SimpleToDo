import {ApiResponse} from "../schemas/globals.ts";
import {AxiosError, AxiosResponse} from "axios";

export function handleApiResponse<T>(
    res: AxiosResponse<ApiResponse<T>>
): ApiResponse<T> {

    if (res.status === 200 || res.status === 201) {
        return {
            ok: true,
            statusCode: res.data.statusCode,
            statusMessage: res.data.statusMessage,
            errors: res.data.errors,
            result: res.data.result
        }
    } else {
        return {
            ok: false,
            statusCode: res.data.statusCode,
            statusMessage: res.data.statusMessage,
            errors: res.data.errors,
        }
    }
}

export function handleApiError<T>(
    res: AxiosResponse<ApiResponse<T>> | AxiosError<ApiResponse<T>>
): ApiResponse<T> {

    if (res instanceof AxiosError) {
        return {
            ok: false,
            statusCode: res.response?.status || 500,
            statusMessage: res.response?.data.statusMessage || res.message,
            errors: res.response?.data.errors || 'Internal Server Error',
        }
    } else {
        return {
            ok: false,
            statusCode: 500,
            statusMessage: 'Internal Server Error',
            errors: 'Internal Server Error',
        }
    }
}

