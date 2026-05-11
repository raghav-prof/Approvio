import Message from "../models/message.model.js"
import Project from "../models/project.model.js"
import Notification from "../models/notification.model.js"
import asyncHandler from "../utils/asyncHandler.js"
import ApiError from "../utils/apiError.js"
import ApiResponse from "../utils/apiResponse.js"
import { uploadToCloudinary } from "../services/cloudinary.js"
import { emitToProject, emitToUser } from "../services/socket.js"

/**
 * Send a message in a project chat
 * POST /api/messages
 */
export const sendMessage = asyncHandler(async (req, res) => {
    const { project: projectId, text } = req.body

    if (!projectId) throw new ApiError(400, "Project ID is required")
    if (!text && (!req.files || req.files.length === 0)) {
        throw new ApiError(400, "Message must have text or attachments")
    }

    const project = await Project.findById(projectId).populate("workspace")
    if (!project) throw new ApiError(404, "Project not found")

    // Upload attachments if any
    let attachments = []
    if (req.files && req.files.length > 0) {
        for (const file of req.files) {
            const result = await uploadToCloudinary(file.path, "approvio/messages")
            const ext = file.originalname.split(".").pop().toLowerCase()
            const type = ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)
                ? "image"
                : ["mp4", "mov", "avi", "webm"].includes(ext)
                    ? "video"
                    : "document"
            attachments.push({
                url: result.secure_url,
                publicId: result.public_id,
                type,
                originalName: file.originalname,
                size: file.size,
            })
        }
    }

    const parentMessage = req.body.parentMessage || null

    const message = await Message.create({
        project: projectId,
        sender: req.user._id,
        text: text || "",
        attachments,
        readBy: [req.user._id],
        parentMessage,
    })

    // Increment thread count on parent
    if (parentMessage) {
        await Message.findByIdAndUpdate(parentMessage, { $inc: { threadCount: 1 } })
    }

    const populated = await Message.findById(message._id).populate(
        "sender",
        "name email avatar role"
    )

    // Emit to project room in real-time
    emitToProject(projectId, "chat_message", populated)

    // Send notifications to other project members
    const editors = project.assignedEditors || []
    const membersToNotify = [project.createdBy, ...editors]
        .filter((id) => id.toString() !== req.user._id.toString())

    for (const userId of membersToNotify) {
        const notif = await Notification.create({
            recipient: userId,
            type: "new_message",
            title: "New message",
            message: `${req.user.name} in ${project.name}: ${text?.slice(0, 50) || "Sent an attachment"}`,
            relatedProject: projectId,
            relatedWorkspace: project.workspace._id
        })
        emitToUser(userId, "notification", notif)
    }

    res.status(201).json(new ApiResponse(201, populated, "Message sent"))
})

/**
 * Get messages for a project (paginated)
 * GET /api/messages?project=<id>&page=1&limit=50
 */
export const getMessages = asyncHandler(async (req, res) => {
    const { project: projectId, page = 1, limit = 50 } = req.query

    if (!projectId) throw new ApiError(400, "Project ID is required")

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const total = await Message.countDocuments({ project: projectId, parentMessage: null })

    const messages = await Message.find({ project: projectId, parentMessage: null })
        .populate("sender", "name email avatar role")
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(parseInt(limit))

    res.status(200).json(
        new ApiResponse(200, {
            messages,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit)),
            },
        }, "Messages fetched")
    )
})

/**
 * Mark all messages in a project as read
 * PUT /api/messages/read?project=<id>
 */
export const markRead = asyncHandler(async (req, res) => {
    const { project: projectId } = req.query
    if (!projectId) throw new ApiError(400, "Project ID is required")

    await Message.updateMany(
        { project: projectId, readBy: { $ne: req.user._id } },
        { $addToSet: { readBy: req.user._id } }
    )

    res.status(200).json(new ApiResponse(200, null, "Messages marked as read"))
})

/**
 * Get thread replies for a message
 * GET /api/messages/:id/thread
 */
export const getThread = asyncHandler(async (req, res) => {
    const replies = await Message.find({ parentMessage: req.params.id })
        .populate("sender", "name email avatar role")
        .sort({ createdAt: 1 })

    res.status(200).json(new ApiResponse(200, replies, "Thread fetched"))
})
