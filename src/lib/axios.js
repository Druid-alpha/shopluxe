import axios from 'axios'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true
})

api.interceptors.request.use((config) => {
    try {
        const token = localStorage.getItem('accessToken')
        if (token) {
            config.headers = config.headers || {}
            config.headers.Authorization = `Bearer ${token}`
        }
    } catch {
        // Ignore token read errors (e.g. SSR or private mode restrictions)
    }
    return config
})

export default api
