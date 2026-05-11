import axios from "axios"

const API = axios.create({
    baseURL: "https://approvio.onrender.com/api",
    withCredentials: true,
    headers: { "Content-Type": "application/json" }
})

// Request interceptor — attach token from localStorage
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

            // Don't attempt refresh if there's no token stored
            const storedToken = localStorage.getItem("accessToken")
            if (!storedToken) {
                return Promise.reject(error)
            }

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
                // Don't force redirect — let the auth context handle it naturally
                return Promise.reject(error)
            }
        }
        return Promise.reject(error)
    }
)

export default API
