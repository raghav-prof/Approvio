import { Router } from "express"
import { createReview, getReviews } from "../controllers/review.controllers.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()
router.use(verifyJWT)

router.post("/", createReview)
router.get("/", getReviews)

export default router
