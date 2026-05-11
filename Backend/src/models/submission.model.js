import mongoose from "mongoose"

const FileSchema = new mongoose.Schema({
    url: { type: String, required: true },
    publicId: { type: String, default: "" },
    type: {
        type: String,
        enum: ["image", "video", "document"],
        default: "image"
    },
    originalName: { type: String, default: "" },
    size: { type: Number, default: 0 }
}, { _id: false })

const SubmissionSchema = new mongoose.Schema({
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
        required: true
    },
    submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    title: {
        type: String,
        required: [true, "Submission title is required"],
        trim: true,
        maxlength: 300
    },
    description: {
        type: String,
        default: "",
        maxlength: 5000
    },
    files: [FileSchema],
    version: {
        type: Number,
        default: 1
    },
    parentSubmission: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Submission",
        default: null
    },
    status: {
        type: String,
        enum: ["pending", "in_review", "approved", "revision_requested", "rejected"],
        default: "pending"
    }
}, { timestamps: true })

SubmissionSchema.index({ project: 1, status: 1 })
SubmissionSchema.index({ submittedBy: 1 })
SubmissionSchema.index({ parentSubmission: 1 })

const Submission = mongoose.model("Submission", SubmissionSchema)
export default Submission
