import mongoose from "mongoose"
import { v4 as uuidv4 } from "uuid"

const InvitationSchema = new mongoose.Schema({
    workspace: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Workspace",
        required: true
    },
    invitedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        trim: true,
        lowercase: true
    },
    role: {
        type: String,
        enum: ["admin", "editor"],
        default: "editor"
    },
    token: {
        type: String,
        unique: true,
        default: () => uuidv4()
    },
    status: {
        type: String,
        enum: ["pending", "accepted", "expired"],
        default: "pending"
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    }
}, { timestamps: true })

InvitationSchema.index({ workspace: 1, email: 1 })

const Invitation = mongoose.model("Invitation", InvitationSchema)
export default Invitation
