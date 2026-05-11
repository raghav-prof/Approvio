import http from "http"
import app from "./app.js"
import dotenv from "dotenv"
import { ConnectDB } from "./db/ConnectDB.js"
import { initializeSocket } from "./services/socket.js"
dotenv.config()

const port = process.env.PORT || 4100

async function host() {
    try {
        await ConnectDB()

        const server = http.createServer(app)
        initializeSocket(server)

        server.listen(port, () => {
            console.log(`🚀 Approvio server listening on port ${port}`)
            console.log(`📡 Socket.IO ready`)
        })
    } catch (err) {
        console.error("Failed to start server:", err)
        process.exit(1)
    }
}

host()
