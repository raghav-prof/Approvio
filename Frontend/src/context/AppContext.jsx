import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { io } from "socket.io-client"
import { useAuth } from "./AuthContext"
import API from "../api/axios"

const AppContext = createContext(null)

export function AppProvider({ children }) {
    const { user } = useAuth()
    const [socket, setSocket] = useState(null)
    const [notifications, setNotifications] = useState([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [workspaces, setWorkspaces] = useState([])
    const [currentWorkspace, setCurrentWorkspace] = useState(null)

    // Socket connection
    useEffect(() => {
        if (!user) return

        const s = io("https://approvio.onrender.com", { withCredentials: true })
        s.on("connect", () => {
            s.emit("join_user", user.id)
        })

        s.on("notification", (notif) => {
            setNotifications(prev => [notif, ...prev])
            setUnreadCount(prev => prev + 1)
        })

        setSocket(s)
        return () => { s.disconnect() }
    }, [user])

    // Fetch initial data
    useEffect(() => {
        if (!user) return
        fetchNotifications()
        fetchWorkspaces()
    }, [user])

    async function fetchNotifications() {
        try {
            const { data } = await API.get("/notifications?limit=20")
            setNotifications(data.data.notifications)
            const countRes = await API.get("/notifications/unread-count")
            setUnreadCount(countRes.data.data.count)
        } catch {}
    }

    async function fetchWorkspaces() {
        try {
            const { data } = await API.get("/workspaces")
            setWorkspaces(data.data)
        } catch {}
    }

    const markNotificationRead = useCallback(async (id) => {
        try {
            await API.put(`/notifications/${id}/read`)
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n))
            setUnreadCount(prev => Math.max(0, prev - 1))
        } catch {}
    }, [])

    const markAllRead = useCallback(async () => {
        try {
            await API.put("/notifications/read-all")
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
            setUnreadCount(0)
        } catch {}
    }, [])

    return (
        <AppContext.Provider value={{
            socket, notifications, unreadCount, workspaces, currentWorkspace,
            setCurrentWorkspace, fetchWorkspaces, fetchNotifications,
            markNotificationRead, markAllRead,
        }}>
            {children}
        </AppContext.Provider>
    )
}

export function useApp() {
    const ctx = useContext(AppContext)
    if (!ctx) throw new Error("useApp must be used within AppProvider")
    return ctx
}
