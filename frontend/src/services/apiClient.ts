import axios, {AxiosInstance} from 'axios'

const baseUrl = import.meta.env.VITE_API_BASE_URL

const apiClient: AxiosInstance = axios.create({
    baseURL: `${baseUrl}/api/v1`,
    timeout: 1000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    withCredentials: true,
})

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

export { apiClient }