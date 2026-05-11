import mongoose from "mongoose"

const ReviewSchema = new mongoose.Schema({
    submission: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Submission",
        required: true
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    action: {
        type: String,
        enum: ["approved", "revision_requested", "rejected"],
        required: true
    },
    notes: {
        type: String,
        default: "",
        maxlength: 5000
    }
}, { timestamps: true })

ReviewSchema.index({ submission: 1, createdAt: -1 })

const Review = mongoose.model("Review", ReviewSchema)
export default Review
