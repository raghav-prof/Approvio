import asyncHandler from "../utils/asyncHandler.js"
import ApiError from "../utils/apiError.js"
import ApiResponse from "../utils/apiResponse.js"
import Review from "../models/review.model.js"
import Submission from "../models/submission.model.js"
import Notification from "../models/notification.model.js"
import { emitToUser, emitToProject } from "../services/socket.js"

export const createReview = asyncHandler(async (req, res) => {
    const { submission: submissionId, action, notes } = req.body
    if (!submissionId || !action) throw new ApiError(400, "Submission ID and action are required")

    if (!["approved", "revision_requested", "rejected"].includes(action))
        throw new ApiError(400, "Action must be approved, revision_requested, or rejected")

    if (action === "revision_requested" && !notes)
        throw new ApiError(400, "Notes are required when requesting revisions")

    const submission = await Submission.findById(submissionId)
        .populate("project", "name workspace")
    if (!submission) throw new ApiError(404, "Submission not found")

    // Create the review
    const review = await Review.create({
        submission: submissionId,
        reviewedBy: req.user._id,
        action, notes: notes || ""
    })

    // Update submission status
    submission.status = action
    await submission.save()

    // Build notification
    const typeMap = {
        approved: "submission_approved",
        revision_requested: "revision_requested",
        rejected: "submission_rejected"
    }
    const titleMap = {
        approved: "Submission Approved ✅",
        revision_requested: "Revisions Requested 🔄",
        rejected: "Submission Rejected ❌"
    }

    const notification = await Notification.create({
        recipient: submission.submittedBy,
        type: typeMap[action],
        title: titleMap[action],
        message: `Your submission "${submission.title}" was ${action.replace("_", " ")}${notes ? `: ${notes.slice(0, 100)}` : ""}`,
        relatedSubmission: submissionId,
        relatedProject: submission.project._id,
        relatedWorkspace: submission.project.workspace
    })

    emitToUser(submission.submittedBy.toString(), "notification", notification)
    emitToUser(submission.submittedBy.toString(), "submission_reviewed", {
        submissionId, action, notes
    })
    emitToProject(submission.project._id.toString(), "submission_updated", {
        submissionId, status: action
    })

    const populated = await Review.findById(review._id)
        .populate("reviewedBy", "name email avatar")
        .populate("submission", "title status")

    return res.status(201).json(new ApiResponse(201, populated, "Review submitted"))
})

export const getReviews = asyncHandler(async (req, res) => {
    const { submission } = req.query
    if (!submission) throw new ApiError(400, "Submission ID is required")

    const reviews = await Review.find({ submission })
        .populate("reviewedBy", "name email avatar")
        .sort({ createdAt: -1 })

    return res.status(200).json(new ApiResponse(200, reviews, "Reviews fetched"))
})
