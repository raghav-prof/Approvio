import { createContext, useContext, useState, useEffect } from "react"
import API from "../api/axios"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        checkAuth()
    }, [])

    async function checkAuth() {
        try {
            const { data } = await API.get("/auth/me")
            setUser(data.data)
        } catch {
            setUser(null)
        } finally {
            setLoading(false)
        }
    }

    async function login(email, password) {
        const { data } = await API.post("/auth/login", { email, password })
        localStorage.setItem("accessToken", data.data.accessToken)
        setUser(data.data.user)
        return data.data.user
    }

    async function register(name, email, password, role) {
        const { data } = await API.post("/auth/register", { name, email, password, role })
        localStorage.setItem("accessToken", data.data.accessToken)
        setUser(data.data.user)
        return data.data.user
    }

    async function googleLogin(credential) {
        const { data } = await API.post("/auth/google", { credential })
        localStorage.setItem("accessToken", data.data.accessToken)
        setUser(data.data.user)
        return data.data.user
    }

    async function logout() {
        try { await API.post("/auth/logout") } catch {}
        localStorage.removeItem("accessToken")
        setUser(null)
    }

    async function updateProfile(updates) {
        const { data } = await API.put("/auth/profile", updates)
        setUser(prev => ({ ...prev, ...data.data }))
        return data.data
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, register, googleLogin, logout, updateProfile, checkAuth }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error("useAuth must be used within AuthProvider")
    return ctx
}
