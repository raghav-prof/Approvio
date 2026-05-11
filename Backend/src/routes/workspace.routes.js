import { Router } from "express"
import { createWorkspace, getWorkspaces, getWorkspaceById, updateWorkspace, deleteWorkspace, addMemberDirect } from "../controllers/workspace.controllers.js"
import { inviteMember, acceptInvitation, getMembers, updateMemberRole, removeMember } from "../controllers/member.controllers.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()

// All workspace routes require auth
router.use(verifyJWT)

// Workspace CRUD
router.post("/", createWorkspace)
router.get("/", getWorkspaces)
router.get("/:id", getWorkspaceById)
router.put("/:id", updateWorkspace)
router.delete("/:id", deleteWorkspace)

// Member management
router.post("/:id/invite", inviteMember)
router.post("/join/:token", acceptInvitation)
router.get("/:id/members", getMembers)
router.put("/:id/members/:userId", updateMemberRole)
router.delete("/:id/members/:userId", removeMember)
router.post("/:id/add-member", addMemberDirect)

export default router
