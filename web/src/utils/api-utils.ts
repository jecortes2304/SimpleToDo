import {ApiResponse} from "../schemas/global.ts";
import {AxiosError, AxiosResponse} from "axios";

export function getApiErrorMessage(errors: ApiResponse<unknown>['errors'], fallback = 'Internal Server Error'): string {
    if (Array.isArray(errors)) return errors.join('\n');
    return errors || fallback;
}

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

