import { Router } from "express"
import { getNotifications, markAsRead, markAllAsRead, getUnreadCount } from "../controllers/notification.controllers.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()
router.use(verifyJWT)

router.get("/", getNotifications)
router.get("/unread-count", getUnreadCount)
router.put("/read-all", markAllAsRead)
router.put("/:id/read", markAsRead)

export default router
