import asyncHandler from "../utils/asyncHandler.js"
import ApiError from "../utils/apiError.js"
import ApiResponse from "../utils/apiResponse.js"
import Submission from "../models/submission.model.js"
import Project from "../models/project.model.js"
import Notification from "../models/notification.model.js"
import { uploadToCloudinary } from "../services/cloudinary.js"
import { emitToUser, emitToProject } from "../services/socket.js"
import fs from "fs"

function getFileType(mimetype) {
    if (mimetype.startsWith("image/")) return "image"
    if (mimetype.startsWith("video/")) return "video"
    return "document"
}

export const createSubmission = asyncHandler(async (req, res) => {
    const { project, title, description } = req.body
    if (!project || !title) throw new ApiError(400, "Project and title are required")

    const proj = await Project.findById(project).populate("workspace", "members owner name")
    if (!proj) throw new ApiError(404, "Project not found")

    const isMember = proj.workspace.members.some(m => m.user.toString() === req.user._id.toString())
    if (!isMember) throw new ApiError(403, "Not a member of this workspace")

    // Upload files to Cloudinary
    const files = []
    if (req.files && req.files.length > 0) {
        for (const file of req.files) {
            const result = await uploadToCloudinary(file.path, `approvio/projects/${project}`)
            if (result) {
                files.push({
                    url: result.secure_url,
                    publicId: result.public_id,
                    type: getFileType(file.mimetype),
                    originalName: file.originalname,
                    size: file.size
                })
            }
        }
    }

    const submission = await Submission.create({
        project, submittedBy: req.user._id, title,
        description: description || "", files, status: "pending"
    })

    const populated = await Submission.findById(submission._id)
        .populate("submittedBy", "name email avatar")
        .populate("project", "name workspace")

    // Notify project owner/admins
    const ownerNotif = await Notification.create({
        recipient: proj.workspace.owner,
        type: "submission_new", title: "New Submission",
        message: `${req.user.name} submitted "${title}" in ${proj.name}`,
        relatedSubmission: submission._id, relatedProject: project,
        relatedWorkspace: proj.workspace._id
    })
    emitToUser(proj.workspace.owner.toString(), "notification", ownerNotif)
    emitToProject(project, "new_submission", populated)

    return res.status(201).json(new ApiResponse(201, populated, "Submission created"))
})

export const getSubmissions = asyncHandler(async (req, res) => {
    const { project, status, submittedBy } = req.query
    if (!project) throw new ApiError(400, "Project ID is required")

    const query = { project }
    if (status) query.status = status
    if (submittedBy) query.submittedBy = submittedBy

    // Only show root submissions (not versions)
    query.parentSubmission = null

    const submissions = await Submission.find(query)
        .populate("submittedBy", "name email avatar")
        .sort({ createdAt: -1 })

    return res.status(200).json(new ApiResponse(200, submissions, "Submissions fetched"))
})

export const getSubmissionById = asyncHandler(async (req, res) => {
    const submission = await Submission.findById(req.params.id)
        .populate("submittedBy", "name email avatar")
        .populate("project", "name workspace assignedEditors")
        .populate("parentSubmission")

    if (!submission) throw new ApiError(404, "Submission not found")

    // Get version history
    const versions = await Submission.find({ parentSubmission: submission.parentSubmission || submission._id })
        .populate("submittedBy", "name email avatar")
        .sort({ version: -1 })

    return res.status(200).json(new ApiResponse(200, { submission, versions }, "Submission fetched"))
})

export const updateSubmission = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    const submission = await Submission.findById(req.params.id)
    if (!submission) throw new ApiError(404, "Submission not found")

    if (submission.submittedBy.toString() !== req.user._id.toString())
        throw new ApiError(403, "Only the submitter can edit")
    if (submission.status === "approved")
        throw new ApiError(400, "Cannot edit an approved submission")

    if (title !== undefined) submission.title = title
    if (description !== undefined) submission.description = description
    await submission.save()

    const populated = await Submission.findById(submission._id)
        .populate("submittedBy", "name email avatar")
    return res.status(200).json(new ApiResponse(200, populated, "Submission updated"))
})

export const deleteSubmission = asyncHandler(async (req, res) => {
    const submission = await Submission.findById(req.params.id)
    if (!submission) throw new ApiError(404, "Submission not found")

    if (submission.submittedBy.toString() !== req.user._id.toString())
        throw new ApiError(403, "Only the submitter can delete")

    await Submission.findByIdAndDelete(req.params.id)
    return res.status(200).json(new ApiResponse(200, {}, "Submission deleted"))
})

export const resubmit = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    const parent = await Submission.findById(req.params.id)
    if (!parent) throw new ApiError(404, "Original submission not found")

    // Count existing versions
    const versionCount = await Submission.countDocuments({
        $or: [{ _id: parent._id }, { parentSubmission: parent._id }]
    })

    const files = []
    if (req.files && req.files.length > 0) {
        for (const file of req.files) {
            const result = await uploadToCloudinary(file.path, `approvio/projects/${parent.project}`)
            if (result) {
                files.push({
                    url: result.secure_url, publicId: result.public_id,
                    type: getFileType(file.mimetype),
                    originalName: file.originalname, size: file.size
                })
            }
        }
    }

    const newVersion = await Submission.create({
        project: parent.project, submittedBy: req.user._id,
        title: title || parent.title, description: description || parent.description,
        files: files.length > 0 ? files : parent.files,
        version: versionCount + 1, parentSubmission: parent._id, status: "pending"
    })

    // Update parent status to show revision was submitted
    parent.status = "pending"
    await parent.save()

    const populated = await newVersion.populate("submittedBy", "name email avatar")
    emitToProject(parent.project.toString(), "new_submission", populated)

    return res.status(201).json(new ApiResponse(201, populated, "Resubmission created"))
})
