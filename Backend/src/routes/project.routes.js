import { Router } from "express"
import { createProject, getProjects, getProjectById, updateProject, deleteProject, assignEditors } from "../controllers/project.controllers.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()
router.use(verifyJWT)

router.post("/", createProject)
router.get("/", getProjects)
router.get("/:id", getProjectById)
router.put("/:id", updateProject)
router.delete("/:id", deleteProject)
router.put("/:id/assign", assignEditors)

export default router
