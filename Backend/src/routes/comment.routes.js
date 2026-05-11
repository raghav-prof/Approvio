import { Router } from "express"
import { createComment, getComments, deleteComment } from "../controllers/comment.controllers.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()
router.use(verifyJWT)

router.post("/", createComment)
router.get("/", getComments)
router.delete("/:id", deleteComment)

export default router
