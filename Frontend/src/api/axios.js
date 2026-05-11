import axios from "axios"

const API = axios.create({
    baseURL: "https://approvio.onrender.com/api",
    withCredentials: true,
    headers: { "Content-Type": "application/json" }
})

// Request interceptor — attach token from localStorage as fallback
API.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken")
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Response interceptor — handle 401 with token refresh
API.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true
            try {
                const { data } = await axios.post(
                    "https://approvio.onrender.com/api/auth/refresh",
                    {},
                    { withCredentials: true }
                )
                const newToken = data.data.accessToken
                localStorage.setItem("accessToken", newToken)
                originalRequest.headers.Authorization = `Bearer ${newToken}`
                return API(originalRequest)
            } catch {
                localStorage.removeItem("accessToken")
                window.location.href = "/login"
                return Promise.reject(error)
            }
        }
        return Promise.reject(error)
    }
)

export default API
