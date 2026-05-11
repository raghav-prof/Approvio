import multer from "multer"
import path from "path"
import { v4 as uuidv4 } from "uuid"

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname)
        const uniqueName = `${uuidv4()}${ext}`
        cb(null, uniqueName)
    }
})

const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
        "video/mp4", "video/webm", "video/quicktime",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ]

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true)
    } else {
        cb(new Error(`File type ${file.mimetype} is not supported`), false)
    }
}

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max
        files: 10 // max 10 files per request
    }
})
