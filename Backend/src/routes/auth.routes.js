import { Router } from "express"
import { register, login, logout, getMe, refreshAccessToken, updateProfile, googleAuth, listEditors } from "../controllers/auth.controllers.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()

router.post("/register", register)
router.post("/login", login)
router.post("/google", googleAuth)
router.post("/refresh", refreshAccessToken)
router.post("/logout", verifyJWT, logout)
router.get("/me", verifyJWT, getMe)
router.put("/profile", verifyJWT, updateProfile)
router.get("/editors", verifyJWT, listEditors)

export default router
