import asyncHandler from "../utils/asyncHandler.js"
import ApiError from "../utils/apiError.js"
import ApiResponse from "../utils/apiResponse.js"
import Workspace from "../models/workspace.model.js"

export const createWorkspace = asyncHandler(async (req, res) => {
    const { name, description, logo } = req.body

    if (!name)
        throw new ApiError(400, "Workspace name is required")

    const workspace = await Workspace.create({
        name,
        description: description || "",
        logo: logo || "",
        owner: req.user._id,
    })

    const populated = await Workspace.findById(workspace._id)
        .populate("owner", "name email avatar")
        .populate("members.user", "name email avatar")

    return res
        .status(201)
        .json(new ApiResponse(201, populated, "Workspace created"))
})

export const getWorkspaces = asyncHandler(async (req, res) => {
    const workspaces = await Workspace.find({
        "members.user": req.user._id
    })
        .populate("owner", "name email avatar")
        .populate("members.user", "name email avatar")
        .sort({ updatedAt: -1 })

    return res
        .status(200)
        .json(new ApiResponse(200, workspaces, "Workspaces fetched"))
})

export const getWorkspaceById = asyncHandler(async (req, res) => {
    const workspace = await Workspace.findById(req.params.id)
        .populate("owner", "name email avatar")
        .populate("members.user", "name email avatar")

    if (!workspace)
        throw new ApiError(404, "Workspace not found")

    // Check membership
    const isMember = workspace.members.some(
        m => m.user._id.toString() === req.user._id.toString()
    )
    if (!isMember)
        throw new ApiError(403, "You are not a member of this workspace")

    return res
        .status(200)
        .json(new ApiResponse(200, workspace, "Workspace fetched"))
})

export const updateWorkspace = asyncHandler(async (req, res) => {
    const { name, description, logo } = req.body
    const workspace = await Workspace.findById(req.params.id)

    if (!workspace)
        throw new ApiError(404, "Workspace not found")

    // Only owner or admin can update
    const member = workspace.members.find(
        m => m.user.toString() === req.user._id.toString()
    )
    if (!member || !["owner", "admin"].includes(member.role))
        throw new ApiError(403, "Only owner or admin can update the workspace")

    if (name !== undefined) workspace.name = name
    if (description !== undefined) workspace.description = description
    if (logo !== undefined) workspace.logo = logo

    await workspace.save()

    const populated = await Workspace.findById(workspace._id)
        .populate("owner", "name email avatar")
        .populate("members.user", "name email avatar")

    return res
        .status(200)
        .json(new ApiResponse(200, populated, "Workspace updated"))
})

export const deleteWorkspace = asyncHandler(async (req, res) => {
    const workspace = await Workspace.findById(req.params.id)

    if (!workspace)
        throw new ApiError(404, "Workspace not found")

    if (workspace.owner.toString() !== req.user._id.toString())
        throw new ApiError(403, "Only the owner can delete the workspace")

    await Workspace.findByIdAndDelete(req.params.id)

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Workspace deleted"))
})

export const addMemberDirect = asyncHandler(async (req, res) => {
    const { userId } = req.body
    if (!userId) throw new ApiError(400, "User ID is required")

    const workspace = await Workspace.findById(req.params.id)
    if (!workspace) throw new ApiError(404, "Workspace not found")

    const member = workspace.members.find(m => m.user.toString() === req.user._id.toString())
    if (!member || !["owner", "admin"].includes(member.role))
        throw new ApiError(403, "Only owner or admin can add members")

    const alreadyMember = workspace.members.some(m => m.user.toString() === userId)
    if (alreadyMember) throw new ApiError(400, "User is already a member")

    workspace.members.push({ user: userId, role: "editor" })
    await workspace.save()

    const populated = await Workspace.findById(workspace._id)
        .populate("owner", "name email avatar")
        .populate("members.user", "name email avatar")

    return res.status(200).json(new ApiResponse(200, populated, "Member added"))
})
