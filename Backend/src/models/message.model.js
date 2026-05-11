import mongoose from "mongoose"

const messageSchema = new mongoose.Schema(
    {
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true,
            index: true,
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        text: {
            type: String,
            default: "",
        },
        attachments: [
            {
                url: String,
                publicId: String,
                type: { type: String, enum: ["image", "video", "document"] },
                originalName: String,
                size: Number,
            },
        ],
        readBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        parentMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
            default: null,
        },
        threadCount: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
)

messageSchema.index({ project: 1, createdAt: 1 })

const Message = mongoose.model("Message", messageSchema)
export default Message
