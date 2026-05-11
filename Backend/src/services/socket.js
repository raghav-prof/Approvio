import { Server } from "socket.io"

let io = null

/**
 * Initialize Socket.IO with the HTTP server
 */
export const initializeSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: [
                process.env.FRONTEND_URL || "http://localhost:5173",
                "http://localhost:3000",
                "https://approvio.vercel.app",
                "https://approvio-kohl.vercel.app",
            ],
            methods: ["GET", "POST"],
            credentials: true,
        },
    })

    io.on("connection", (socket) => {
        console.log(`Socket connected: ${socket.id}`)

        // Join user-specific room for targeted notifications
        socket.on("join_user", (userId) => {
            socket.join(`user_${userId}`)
            console.log(`User ${userId} joined their notification room`)
        })

        // Join workspace room for workspace-wide updates
        socket.on("join_workspace", (workspaceId) => {
            socket.join(`workspace_${workspaceId}`)
        })

        // Join project room for project-specific updates + chat
        socket.on("join_project", (projectId) => {
            socket.join(`project_${projectId}`)
        })

        // Leave rooms
        socket.on("leave_workspace", (workspaceId) => {
            socket.leave(`workspace_${workspaceId}`)
        })

        socket.on("leave_project", (projectId) => {
            socket.leave(`project_${projectId}`)
        })

        // Typing indicator — broadcast to project room
        socket.on("typing", ({ projectId, user }) => {
            socket.to(`project_${projectId}`).emit("user_typing", { projectId, user })
        })

        socket.on("stop_typing", ({ projectId, user }) => {
            socket.to(`project_${projectId}`).emit("user_stop_typing", { projectId, user })
        })

        socket.on("disconnect", () => {
            console.log(`Socket disconnected: ${socket.id}`)
        })
    })

    return io
}

/**
 * Get the Socket.IO instance
 */
export const getIO = () => {
    if (!io) {
        throw new Error("Socket.IO not initialized")
    }
    return io
}

/**
 * Emit event to a specific user
 */
export const emitToUser = (userId, event, data) => {
    if (io) {
        io.to(`user_${userId}`).emit(event, data)
    }
}

/**
 * Emit event to an entire workspace
 */
export const emitToWorkspace = (workspaceId, event, data) => {
    if (io) {
        io.to(`workspace_${workspaceId}`).emit(event, data)
    }
}

/**
 * Emit event to a specific project room
 */
export const emitToProject = (projectId, event, data) => {
    if (io) {
        io.to(`project_${projectId}`).emit(event, data)
    }
}
