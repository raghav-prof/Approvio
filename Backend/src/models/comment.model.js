import mongoose from "mongoose"

const CommentSchema = new mongoose.Schema({
    submission: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Submission",
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    text: {
        type: String,
        required: [true, "Comment text is required"],
        maxlength: 5000
    },
    attachments: [{
        url: { type: String },
        type: { type: String, enum: ["image", "video", "document"] }
    }],
    parentComment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
        default: null
    },
    mentions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }]
}, { timestamps: true })

CommentSchema.index({ submission: 1, createdAt: 1 })

const Comment = mongoose.model("Comment", CommentSchema)
export default Comment
