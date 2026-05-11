import { v2 as cloudinary } from "cloudinary"
import fs from "fs"
import dotenv from "dotenv"
dotenv.config()

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

/**
 * Upload a file to Cloudinary
 * @param {string} localFilePath - Path to file on local disk
 * @param {string} folder - Cloudinary folder name
 * @returns {Object|null} - Cloudinary upload result or null on failure
 */
export const uploadToCloudinary = async (localFilePath, folder = "approvio") => {
    try {
        if (!localFilePath) return null

        const resourceType = getResourceType(localFilePath)

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: resourceType,
            folder: folder,
        })

        // Remove local file after upload
        fs.unlinkSync(localFilePath)

        return response
    } catch (error) {
        // Remove local file even if upload fails
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath)
        }
        console.error("Cloudinary upload error:", error.message)
        return null
    }
}

/**
 * Delete a file from Cloudinary
 * @param {string} publicId - Cloudinary public_id
 * @param {string} resourceType - auto, image, video, raw
 */
export const deleteFromCloudinary = async (publicId, resourceType = "image") => {
    try {
        if (!publicId) return null
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType,
        })
        return result
    } catch (error) {
        console.error("Cloudinary delete error:", error.message)
        return null
    }
}

/**
 * Determine Cloudinary resource_type from file extension
 */
function getResourceType(filePath) {
    const ext = filePath.split(".").pop().toLowerCase()
    const videoExts = ["mp4", "webm", "mov", "avi", "mkv"]
    const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "svg"]

    if (videoExts.includes(ext)) return "video"
    if (imageExts.includes(ext)) return "image"
    return "raw"
}

export default cloudinary
