import mongoose from "mongoose"

const NotificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    type: {
        type: String,
        enum: [
            "submission_new",
            "submission_approved",
            "submission_rejected",
            "revision_requested",
            "comment_new",
            "invitation",
            "member_added",
            "project_assigned",
            "new_message"
        ],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        default: ""
    },
    relatedSubmission: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Submission",
        default: null
    },
    relatedProject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
        default: null
    },
    relatedWorkspace: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Workspace",
        default: null
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, { timestamps: true })

NotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 })

const Notification = mongoose.model("Notification", NotificationSchema)
export default Notification
