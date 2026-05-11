import { Router } from "express"
import { createSubmission, getSubmissions, getSubmissionById, updateSubmission, deleteSubmission, resubmit } from "../controllers/submission.controllers.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { upload } from "../middlewares/upload.middleware.js"

const router = Router()
router.use(verifyJWT)

router.post("/", upload.array("files", 10), createSubmission)
router.get("/", getSubmissions)
router.get("/:id", getSubmissionById)
router.put("/:id", updateSubmission)
router.delete("/:id", deleteSubmission)
router.post("/:id/resubmit", upload.array("files", 10), resubmit)

export default router
