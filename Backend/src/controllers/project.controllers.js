import asyncHandler from "../utils/asyncHandler.js"
import ApiError from "../utils/apiError.js"
import ApiResponse from "../utils/apiResponse.js"
import Project from "../models/project.model.js"
import Workspace from "../models/workspace.model.js"
import Notification from "../models/notification.model.js"
import { emitToUser } from "../services/socket.js"

export const createProject = asyncHandler(async (req, res) => {
    const { name, description, workspace, deadline, coverImage } = req.body
    if (!name || !workspace) throw new ApiError(400, "Project name and workspace are required")

    const ws = await Workspace.findById(workspace)
    if (!ws) throw new ApiError(404, "Workspace not found")

    const member = ws.members.find(m => m.user.toString() === req.user._id.toString())
    if (!member || !["owner", "admin"].includes(member.role))
        throw new ApiError(403, "Only owner or admin can create projects")

    const project = await Project.create({
        name, description: description || "", workspace,
        deadline: deadline || null, coverImage: coverImage || "", createdBy: req.user._id,
    })

    const populated = await Project.findById(project._id)
        .populate("createdBy", "name email avatar")
        .populate("assignedEditors", "name email avatar")

    return res.status(201).json(new ApiResponse(201, populated, "Project created"))
})

export const getProjects = asyncHandler(async (req, res) => {
    const { workspace, status } = req.query
    if (!workspace) throw new ApiError(400, "Workspace ID is required")

    const ws = await Workspace.findById(workspace)
    if (!ws) throw new ApiError(404, "Workspace not found")

    const isMember = ws.members.some(m => m.user.toString() === req.user._id.toString())
    if (!isMember) throw new ApiError(403, "Not a member")

    const query = { workspace }
    if (status) query.status = status

    const projects = await Project.find(query)
        .populate("createdBy", "name email avatar")
        .populate("assignedEditors", "name email avatar")
        .sort({ updatedAt: -1 })

    return res.status(200).json(new ApiResponse(200, projects, "Projects fetched"))
})

export const getProjectById = asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id)
        .populate("createdBy", "name email avatar")
        .populate("assignedEditors", "name email avatar")
        .populate("workspace", "name members")

    if (!project) throw new ApiError(404, "Project not found")

    const isMember = project.workspace.members.some(m => m.user.toString() === req.user._id.toString())
    if (!isMember) throw new ApiError(403, "Not a member")

    return res.status(200).json(new ApiResponse(200, project, "Project fetched"))
})

export const updateProject = asyncHandler(async (req, res) => {
    const { name, description, status, deadline, coverImage } = req.body
    const project = await Project.findById(req.params.id).populate("workspace", "members owner")
    if (!project) throw new ApiError(404, "Project not found")

    const member = project.workspace.members.find(m => m.user.toString() === req.user._id.toString())
    if (!member || !["owner", "admin"].includes(member.role))
        throw new ApiError(403, "Only owner or admin can update projects")

    if (name !== undefined) project.name = name
    if (description !== undefined) project.description = description
    if (status !== undefined) project.status = status
    if (deadline !== undefined) project.deadline = deadline
    if (coverImage !== undefined) project.coverImage = coverImage
    await project.save()

    const populated = await Project.findById(project._id)
        .populate("createdBy", "name email avatar").populate("assignedEditors", "name email avatar")
    return res.status(200).json(new ApiResponse(200, populated, "Project updated"))
})

export const deleteProject = asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id).populate("workspace", "owner")
    if (!project) throw new ApiError(404, "Project not found")
    if (project.workspace.owner.toString() !== req.user._id.toString())
        throw new ApiError(403, "Only the workspace owner can delete projects")
    await Project.findByIdAndDelete(req.params.id)
    return res.status(200).json(new ApiResponse(200, {}, "Project deleted"))
})

export const assignEditors = asyncHandler(async (req, res) => {
    const { editors } = req.body
    if (!editors || !Array.isArray(editors)) throw new ApiError(400, "Editors array is required")

    const project = await Project.findById(req.params.id).populate("workspace", "members owner name")
    if (!project) throw new ApiError(404, "Project not found")

    const member = project.workspace.members.find(m => m.user.toString() === req.user._id.toString())
    if (!member || !["owner", "admin"].includes(member.role))
        throw new ApiError(403, "Only owner or admin can assign editors")

    project.assignedEditors = editors
    await project.save()

    for (const editorId of editors) {
        if (editorId !== req.user._id.toString()) {
            const notification = await Notification.create({
                recipient: editorId, type: "project_assigned", title: "Project Assignment",
                message: `You've been assigned to "${project.name}"`,
                relatedProject: project._id, relatedWorkspace: project.workspace._id
            })
            emitToUser(editorId, "notification", notification)
        }
    }

    const populated = await Project.findById(project._id)
        .populate("createdBy", "name email avatar").populate("assignedEditors", "name email avatar")
    return res.status(200).json(new ApiResponse(200, populated, "Editors assigned"))
})
