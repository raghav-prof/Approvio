import asyncHandler from "../utils/asyncHandler.js"
import ApiError from "../utils/apiError.js"
import ApiResponse from "../utils/apiResponse.js"
import Notification from "../models/notification.model.js"

export const getNotifications = asyncHandler(async (req, res) => {
    const { page = 1, limit = 30 } = req.query

    const notifications = await Notification.find({ recipient: req.user._id })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .populate("relatedWorkspace", "name")
        .populate("relatedProject", "name")

    const total = await Notification.countDocuments({ recipient: req.user._id })

    return res.status(200).json(new ApiResponse(200, {
        notifications, total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit)
    }, "Notifications fetched"))
})

export const markAsRead = asyncHandler(async (req, res) => {
    const notification = await Notification.findOneAndUpdate(
        { _id: req.params.id, recipient: req.user._id },
        { isRead: true },
        { new: true }
    )
    if (!notification) throw new ApiError(404, "Notification not found")
    return res.status(200).json(new ApiResponse(200, notification, "Marked as read"))
})

export const markAllAsRead = asyncHandler(async (req, res) => {
    await Notification.updateMany(
        { recipient: req.user._id, isRead: false },
        { isRead: true }
    )
    return res.status(200).json(new ApiResponse(200, {}, "All notifications marked as read"))
})

export const getUnreadCount = asyncHandler(async (req, res) => {
    const count = await Notification.countDocuments({
        recipient: req.user._id, isRead: false
    })
    return res.status(200).json(new ApiResponse(200, { count }, "Unread count"))
})
