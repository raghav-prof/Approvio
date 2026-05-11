import mongoose from "mongoose"

const ProjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Project name is required"],
        trim: true,
        maxlength: 200
    },
    description: {
        type: String,
        default: "",
        maxlength: 2000
    },
    workspace: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Workspace",
        required: true
    },
    coverImage: {
        type: String,
        default: ""
    },
    deadline: {
        type: Date,
        default: null
    },
    status: {
        type: String,
        enum: ["active", "completed", "archived"],
        default: "active"
    },
    assignedEditors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, { timestamps: true })

ProjectSchema.index({ workspace: 1, status: 1 })

const Project = mongoose.model("Project", ProjectSchema)
export default Project
