import asyncHandler from "../utils/asyncHandler.js"
import ApiError from "../utils/apiError.js"
import ApiResponse from "../utils/apiResponse.js"
import User from "../models/user.model.js"
import jwt from "jsonwebtoken"

const cookieBaseOptions = {
    httpOnly: true,
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000
}

function getCookieOptions(req) {
    const forwardedProto = req.headers["x-forwarded-proto"]
    const isHttps = req.secure || forwardedProto === "https"
    return {
        ...cookieBaseOptions,
        secure: isHttps,
        sameSite: isHttps ? "None" : "Lax",
    }
}

export const register = asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body
    if (!name || !email || !password)
        throw new ApiError(400, "Name, email, and password are required")
    if (password.length < 8)
        throw new ApiError(400, "Password must be at least 8 characters")

    const existing = await User.findOne({ email })
    if (existing) throw new ApiError(409, "Email already registered")

    const user = await User.create({ name, email, password, role: role || "client" })
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()
    const cookieOptions = getCookieOptions(req)

    return res.status(201)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(new ApiResponse(201, {
            user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
            accessToken, refreshToken
        }, "Registered successfully"))
})

export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body
    if (!email || !password) throw new ApiError(400, "Email and password are required")

    const user = await User.findOne({ email })
    if (!user) throw new ApiError(401, "Invalid credentials")

    const isValid = await user.isPasswordCorrect(password)
    if (!isValid) throw new ApiError(401, "Invalid credentials")

    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()
    const cookieOptions = getCookieOptions(req)

    return res.status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(new ApiResponse(200, {
            user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, bio: user.bio },
            accessToken, refreshToken
        }, "Logged in successfully"))
})

export const googleAuth = asyncHandler(async (req, res) => {
    const { credential } = req.body // Google ID token from frontend

    if (!credential) throw new ApiError(400, "Google credential is required")

    // Verify the Google ID token
    const googlePayload = await verifyGoogleToken(credential)
    if (!googlePayload) throw new ApiError(401, "Invalid Google token")

    const { email, name, picture, sub: googleId } = googlePayload

    // Find or create user
    let user = await User.findOne({ googleId })

    if (!user) {
        user = await User.findOne({ email })
        if (user) {
            // Link existing account to Google
            user.googleId = googleId
            user.avatar = user.avatar || picture
            await user.save()
        } else {
            // Create new user
            user = await User.create({
                name: name || email.split("@")[0],
                email,
                password: `google_${googleId}_${Date.now()}`, // placeholder password
                googleId,
                avatar: picture || "",
                role: "client"
            })
        }
    }

    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()
    const cookieOptions = getCookieOptions(req)

    return res.status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(new ApiResponse(200, {
            user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
            accessToken, refreshToken
        }, "Google auth successful"))
})

async function verifyGoogleToken(credential) {
    try {
        // Decode and verify the JWT from Google
        // Using Google's tokeninfo endpoint for simplicity (no extra dependency)
        const response = await fetch(
            `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`
        )
        if (!response.ok) return null
        const payload = await response.json()

        // Verify audience matches our client ID
        if (payload.aud !== process.env.GOOGLE_CLIENT_ID) return null

        return payload
    } catch {
        return null
    }
}

export const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body?.refreshToken
    if (!incomingRefreshToken) throw new ApiError(401, "Unauthorized access")

    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    const user = await User.findById(decodedToken?._id)
    if (!user) throw new ApiError(401, "Invalid refresh token")

    const accessToken = user.generateAccessToken()
    const cookieOptions = getCookieOptions(req)

    return res.status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .json(new ApiResponse(200, { accessToken }, "Access token refreshed"))
})

export const logout = asyncHandler(async (req, res) => {
    const cookieOptions = getCookieOptions(req)
    return res.status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(new ApiResponse(200, {}, "Logged out"))
})

export const getMe = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, {
        id: req.user._id, name: req.user.name, email: req.user.email,
        role: req.user.role, avatar: req.user.avatar, bio: req.user.bio,
    }, "User info"))
})

export const updateProfile = asyncHandler(async (req, res) => {
    const { name, bio, avatar, role } = req.body
    const updates = {}
    if (name !== undefined) updates.name = name
    if (bio !== undefined) updates.bio = bio
    if (avatar !== undefined) updates.avatar = avatar
    if (role !== undefined && ["client", "editor"].includes(role)) updates.role = role

    const user = await User.findByIdAndUpdate(
        req.user._id, { $set: updates }, { new: true, runValidators: true }
    ).select("-password")

    if (!user) throw new ApiError(404, "User not found")
    return res.status(200).json(new ApiResponse(200, user, "Profile updated"))
})

export const listEditors = asyncHandler(async (req, res) => {
    const { search } = req.query
    const query = { role: "editor" }
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
        ]
    }
    const editors = await User.find(query)
        .select("name email avatar bio")
        .sort({ name: 1 })
        .limit(50)
    return res.status(200).json(new ApiResponse(200, editors, "Editors fetched"))
})
