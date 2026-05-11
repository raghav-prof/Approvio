const asyncHandler = (fn) => async (req, res, next) => {
    try {
        await fn(req, res, next)
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            statusCode: error.statusCode || 500,
            message: error.message,
            errors: error.errors || [],
        })
    }
}

export default asyncHandler
