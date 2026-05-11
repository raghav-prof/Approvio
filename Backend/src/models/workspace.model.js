import mongoose from "mongoose"

const MemberSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    role: {
        type: String,
        enum: ["owner", "admin", "editor"],
        default: "editor"
    },
    joinedAt: {
        type: Date,
        default: Date.now
    }
}, { _id: false })

const WorkspaceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Workspace name is required"],
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        default: "",
        maxlength: 1000
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    logo: {
        type: String,
        default: ""
    },
    members: [MemberSchema]
}, { timestamps: true })

// Ensure owner is always in members array
WorkspaceSchema.pre("save", function () {
    if (this.isNew) {
        const ownerExists = this.members.some(
            m => m.user.toString() === this.owner.toString()
        )
        if (!ownerExists) {
            this.members.push({ user: this.owner, role: "owner" })
        }
    }
})

const Workspace = mongoose.model("Workspace", WorkspaceSchema)
export default Workspace
