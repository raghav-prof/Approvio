import ApiError from "../utils/apiError.js"
import Workspace from "../models/workspace.model.js"
import asyncHandler from "../utils/asyncHandler.js"

/**
 * Middleware factory: checks if the current user has the required role
 * in the workspace specified by req.params.workspaceId or req.body.workspace
 * 
 * Usage: requireRole("owner", "admin")
 */
export const requireRole = (...allowedRoles) => {
    return asyncHandler(async (req, res, next) => {
        const workspaceId = req.params.workspaceId || req.params.id || req.body.workspace

        if (!workspaceId) {
            throw new ApiError(400, "Workspace ID is required")
        }

        const workspace = await Workspace.findById(workspaceId)
        if (!workspace) {
            throw new ApiError(404, "Workspace not found")
        }

        const member = workspace.members.find(
            m => m.user.toString() === req.user._id.toString()
        )

        if (!member) {
            throw new ApiError(403, "You are not a member of this workspace")
        }

        if (!allowedRoles.includes(member.role)) {
            throw new ApiError(403, `Requires one of: ${allowedRoles.join(", ")}`)
        }

        req.workspace = workspace
        req.memberRole = member.role
        next()
    })
}
