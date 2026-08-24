import axios, {AxiosInstance} from 'axios'

const baseUrl = import.meta.env.VITE_API_BASE_URL

const apiClient: AxiosInstance = axios.create({
    baseURL: `${baseUrl}/api/v1`,
    timeout: 1000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Application-Name': 'SimpleTodoWeb'
    },
    withCredentials: true,
})
export { apiClient }