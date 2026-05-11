import asyncHandler from "../utils/asyncHandler.js"
import ApiError from "../utils/apiError.js"
import ApiResponse from "../utils/apiResponse.js"
import Workspace from "../models/workspace.model.js"
import Invitation from "../models/invitation.model.js"
import Notification from "../models/notification.model.js"
import User from "../models/user.model.js"
import { emitToUser } from "../services/socket.js"

export const inviteMember = asyncHandler(async (req, res) => {
    const { email, role } = req.body
    const workspaceId = req.params.id

    if (!email)
        throw new ApiError(400, "Email is required")

    const workspace = await Workspace.findById(workspaceId)
    if (!workspace)
        throw new ApiError(404, "Workspace not found")

    // Check caller is owner or admin
    const callerMember = workspace.members.find(
        m => m.user.toString() === req.user._id.toString()
    )
    if (!callerMember || !["owner", "admin"].includes(callerMember.role))
        throw new ApiError(403, "Only owner or admin can invite members")

    // Check if already a member
    const invitedUser = await User.findOne({ email })
    if (invitedUser) {
        const alreadyMember = workspace.members.some(
            m => m.user.toString() === invitedUser._id.toString()
        )
        if (alreadyMember)
            throw new ApiError(409, "User is already a member of this workspace")
    }

    // Check for existing pending invitation
    const existingInvite = await Invitation.findOne({
        workspace: workspaceId,
        email,
        status: "pending"
    })
    if (existingInvite)
        throw new ApiError(409, "An invitation is already pending for this email")

    const invitation = await Invitation.create({
        workspace: workspaceId,
        invitedBy: req.user._id,
        email,
        role: role || "editor"
    })

    // If user exists, send real-time notification
    if (invitedUser) {
        const notification = await Notification.create({
            recipient: invitedUser._id,
            type: "invitation",
            title: "Workspace Invitation",
            message: `${req.user.name} invited you to join "${workspace.name}"`,
            relatedWorkspace: workspaceId
        })
        emitToUser(invitedUser._id.toString(), "notification", notification)
    }

    return res
        .status(201)
        .json(new ApiResponse(201, {
            invitation,
            inviteLink: `${process.env.FRONTEND_URL}/join/${invitation.token}`
        }, "Invitation sent"))
})

export const acceptInvitation = asyncHandler(async (req, res) => {
    const { token } = req.params

    const invitation = await Invitation.findOne({ token, status: "pending" })
    if (!invitation)
        throw new ApiError(404, "Invalid or expired invitation")

    if (new Date() > invitation.expiresAt) {
        invitation.status = "expired"
        await invitation.save()
        throw new ApiError(410, "Invitation has expired")
    }

    const workspace = await Workspace.findById(invitation.workspace)
    if (!workspace)
        throw new ApiError(404, "Workspace no longer exists")

    // Check if already a member
    const alreadyMember = workspace.members.some(
        m => m.user.toString() === req.user._id.toString()
    )
    if (alreadyMember) {
        invitation.status = "accepted"
        await invitation.save()
        return res.status(200).json(new ApiResponse(200, workspace, "Already a member"))
    }

    // Add to workspace
    workspace.members.push({
        user: req.user._id,
        role: invitation.role
    })
    await workspace.save()

    invitation.status = "accepted"
    await invitation.save()

    // Notify the workspace owner
    const notification = await Notification.create({
        recipient: workspace.owner,
        type: "member_added",
        title: "New Team Member",
        message: `${req.user.name} joined "${workspace.name}"`,
        relatedWorkspace: workspace._id
    })
    emitToUser(workspace.owner.toString(), "notification", notification)

    const populated = await Workspace.findById(workspace._id)
        .populate("owner", "name email avatar")
        .populate("members.user", "name email avatar")

    return res
        .status(200)
        .json(new ApiResponse(200, populated, "Joined workspace successfully"))
})

export const getMembers = asyncHandler(async (req, res) => {
    const workspace = await Workspace.findById(req.params.id)
        .populate("members.user", "name email avatar bio role")

    if (!workspace)
        throw new ApiError(404, "Workspace not found")

    const isMember = workspace.members.some(
        m => m.user._id.toString() === req.user._id.toString()
    )
    if (!isMember)
        throw new ApiError(403, "You are not a member of this workspace")

    return res
        .status(200)
        .json(new ApiResponse(200, workspace.members, "Members fetched"))
})

export const updateMemberRole = asyncHandler(async (req, res) => {
    const { role } = req.body
    const { id: workspaceId, userId } = req.params

    if (!role || !["admin", "editor"].includes(role))
        throw new ApiError(400, "Valid role (admin/editor) is required")

    const workspace = await Workspace.findById(workspaceId)
    if (!workspace)
        throw new ApiError(404, "Workspace not found")

    // Only owner can change roles
    if (workspace.owner.toString() !== req.user._id.toString())
        throw new ApiError(403, "Only the workspace owner can change roles")

    const member = workspace.members.find(
        m => m.user.toString() === userId
    )
    if (!member)
        throw new ApiError(404, "Member not found in workspace")

    if (member.role === "owner")
        throw new ApiError(400, "Cannot change the owner's role")

    member.role = role
    await workspace.save()

    return res
        .status(200)
        .json(new ApiResponse(200, workspace.members, "Member role updated"))
})

export const removeMember = asyncHandler(async (req, res) => {
    const { id: workspaceId, userId } = req.params

    const workspace = await Workspace.findById(workspaceId)
    if (!workspace)
        throw new ApiError(404, "Workspace not found")

    // Owner or admin can remove, or a user can remove themselves
    const callerMember = workspace.members.find(
        m => m.user.toString() === req.user._id.toString()
    )
    const isSelf = req.user._id.toString() === userId
    const isOwnerOrAdmin = callerMember && ["owner", "admin"].includes(callerMember.role)

    if (!isSelf && !isOwnerOrAdmin)
        throw new ApiError(403, "Insufficient permissions to remove this member")

    // Can't remove the owner
    if (workspace.owner.toString() === userId)
        throw new ApiError(400, "Cannot remove the workspace owner")

    workspace.members = workspace.members.filter(
        m => m.user.toString() !== userId
    )
    await workspace.save()

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Member removed"))
})
