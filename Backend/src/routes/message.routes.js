import { Router } from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { upload } from "../middlewares/upload.middleware.js"
import { sendMessage, getMessages, markRead } from "../controllers/message.controllers.js"

const router = Router()

router.use(verifyJWT)

router.post("/", upload.array("files", 5), sendMessage)
router.get("/", getMessages)
router.put("/read", markRead)

export default router
