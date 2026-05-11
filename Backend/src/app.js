import express from "express"
import cors from "cors"
import mongoose from "mongoose"
import cookieParser from "cookie-parser"
import dotenv from "dotenv"
dotenv.config()

import authRouter from "./routes/auth.routes.js"
import workspaceRouter from "./routes/workspace.routes.js"
import projectRouter from "./routes/project.routes.js"
import submissionRouter from "./routes/submission.routes.js"
import reviewRouter from "./routes/review.routes.js"
import commentRouter from "./routes/comment.routes.js"
import notificationRouter from "./routes/notification.routes.js"
import messageRouter from "./routes/message.routes.js"
import ApiResponse from "./utils/apiResponse.js"

const app = express()

app.set("trust proxy", 1)
app.use(express.json({ limit: "100kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())

const allowedOrigins = new Set([
    "http://localhost:5173",
    "http://localhost:3000",
    "https://approvio.vercel.app",
    "https://approvio-kohl.vercel.app",
    "https://approvio.onrender.com",
    process.env.FRONTEND_URL,
].filter(Boolean))

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin) return callback(null, true)
        const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)
        if (isLocalhost || allowedOrigins.has(origin)) {
            return callback(null, true)
        }
        return callback(new Error(`CORS blocked for origin: ${origin}`))
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    credentials: true,
    sameSite: "None"
}

app.use(cors(corsOptions))

// Health check
async function getStats() {
    const startTime = Date.now()
    const result = await mongoose.connection.db.command({ ping: 1 })
    const latency = Date.now() - startTime
    return {
        status: "OK",
        app: "Approvio API",
        mongoDB: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
        latency: latency + "ms",
        timestamp: new Date(),
    }
}

app.get("/", async (req, res) => {
    const statusInfo = await getStats()
    res.status(200).json(new ApiResponse(200, statusInfo, "Approvio server is live 🚀"))
})

// API Routes
app.use("/api/auth", authRouter)
app.use("/api/workspaces", workspaceRouter)
app.use("/api/projects", projectRouter)
app.use("/api/submissions", submissionRouter)
app.use("/api/reviews", reviewRouter)
app.use("/api/comments", commentRouter)
app.use("/api/notifications", notificationRouter)
app.use("/api/messages", messageRouter)

// 404 handler
app.use((req, res) => {
    res.status(404).json(new ApiResponse(404, null, "Resource not found"))
})

export default app
