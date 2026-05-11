import jwt from "jsonwebtoken"
import ApiError from "../utils/apiError.js"
import User from "../models/user.model.js"
import asyncHandler from "../utils/asyncHandler.js"

export const verifyJWT = asyncHandler(async (req, res, next) => {
    const cookieToken = req.cookies?.accessToken
    const authHeader = req.headers.authorization || req.headers.Authorization
    const bearerToken = typeof authHeader === "string" && authHeader.startsWith("Bearer ")
        ? authHeader.slice(7).trim()
        : null
    const token = cookieToken || bearerToken

    if (!token)
        throw new ApiError(401, "Unauthorized — no token provided")

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

    const user = await User.findById(decoded._id).select("-password")
    if (!user)
        throw new ApiError(401, "Unauthorized — user not found")

    req.user = user
    next()
})
