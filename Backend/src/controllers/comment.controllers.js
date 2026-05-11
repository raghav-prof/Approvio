import asyncHandler from "../utils/asyncHandler.js"
import ApiError from "../utils/apiError.js"
import ApiResponse from "../utils/apiResponse.js"
import Comment from "../models/comment.model.js"
import Submission from "../models/submission.model.js"
import Notification from "../models/notification.model.js"
import { emitToUser, emitToProject } from "../services/socket.js"

export const createComment = asyncHandler(async (req, res) => {
    const { submission: submissionId, text, parentComment, mentions } = req.body
    if (!submissionId || !text) throw new ApiError(400, "Submission and text are required")

    const submission = await Submission.findById(submissionId).populate("project", "name workspace")
    if (!submission) throw new ApiError(404, "Submission not found")

    const comment = await Comment.create({
        submission: submissionId, author: req.user._id, text,
        parentComment: parentComment || null, mentions: mentions || []
    })

    const populated = await Comment.findById(comment._id)
        .populate("author", "name email avatar")
        .populate("mentions", "name email")

    // Notify submission owner (if commenter is different)
    if (submission.submittedBy.toString() !== req.user._id.toString()) {
        const notification = await Notification.create({
            recipient: submission.submittedBy,
            type: "comment_new", title: "New Comment",
            message: `${req.user.name} commented on "${submission.title}": "${text.slice(0, 80)}"`,
            relatedSubmission: submissionId,
            relatedProject: submission.project._id,
            relatedWorkspace: submission.project.workspace
        })
        emitToUser(submission.submittedBy.toString(), "notification", notification)
    }

    // Notify mentioned users
    if (mentions && mentions.length > 0) {
        for (const userId of mentions) {
            if (userId !== req.user._id.toString() && userId !== submission.submittedBy.toString()) {
                const notif = await Notification.create({
                    recipient: userId, type: "comment_new", title: "You were mentioned",
                    message: `${req.user.name} mentioned you in a comment on "${submission.title}"`,
                    relatedSubmission: submissionId, relatedProject: submission.project._id
                })
                emitToUser(userId, "notification", notif)
            }
        }
    }

    emitToProject(submission.project._id.toString(), "new_comment", populated)

    return res.status(201).json(new ApiResponse(201, populated, "Comment added"))
})

export const getComments = asyncHandler(async (req, res) => {
    const { submission } = req.query
    if (!submission) throw new ApiError(400, "Submission ID is required")

    const comments = await Comment.find({ submission })
        .populate("author", "name email avatar")
        .populate("mentions", "name email")
        .populate("parentComment")
        .sort({ createdAt: 1 })

    return res.status(200).json(new ApiResponse(200, comments, "Comments fetched"))
})

export const deleteComment = asyncHandler(async (req, res) => {
    const comment = await Comment.findById(req.params.id)
    if (!comment) throw new ApiError(404, "Comment not found")

    if (comment.author.toString() !== req.user._id.toString())
        throw new ApiError(403, "Only the author can delete this comment")

    await Comment.findByIdAndDelete(req.params.id)
    return res.status(200).json(new ApiResponse(200, {}, "Comment deleted"))
})
