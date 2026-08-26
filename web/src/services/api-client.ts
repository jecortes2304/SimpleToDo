import axios, {AxiosInstance} from 'axios'

// Production is served by the Go application itself, so API calls must stay
// on the current origin. VITE_API_BASE_URL is only a local-development aid.
const baseUrl = import.meta.env.DEV
    ? (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')
    : ''

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
