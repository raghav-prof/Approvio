import mongoose from "mongoose"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name is required"],
        trim: true,
        maxlength: 100
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        trim: true,
        lowercase: true,
        unique: true
    },
    password: {
        type: String,
        required: function() { return !this.googleId },
        minlength: 8
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    avatar: {
        type: String,
        default: ""
    },
    bio: {
        type: String,
        default: "",
        maxlength: 500
    },
    role: {
        type: String,
        enum: ["client", "editor"],
        default: "client"
    }
}, { timestamps: true })

UserSchema.pre("save", async function () {
    if (!this.isModified("password")) return
    this.password = await bcrypt.hash(this.password, 10)
})

UserSchema.methods.isPasswordCorrect = async function (password) {
    if (!this.password) return false
    return await bcrypt.compare(password, this.password)
}

UserSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        { _id: this._id, email: this.email, name: this.name, role: this.role },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    )
}

UserSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        { _id: this._id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    )
}

const User = mongoose.model("User", UserSchema)
export default User
