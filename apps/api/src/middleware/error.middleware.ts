import { Request, Response, NextFunction } from "express";

/**
 * Global error handler middleware.
 * Returns structured JSON error responses.
 */
export function errorHandler(
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
): void {
    console.error("[Error]", err.message);

    // Determine status code based on error type
    let statusCode = 500;
    let code = "INTERNAL_ERROR";

    if (err.message.includes("not found") || err.message.includes("Not Found")) {
        statusCode = 404;
        code = "NOT_FOUND";
    } else if (
        err.message.includes("Unauthorized") ||
        err.message.includes("Invalid")
    ) {
        statusCode = 401;
        code = "UNAUTHORIZED";
    } else if (err.message.includes("Forbidden")) {
        statusCode = 403;
        code = "FORBIDDEN";
    } else if (
        err.message.includes("already exists") ||
        err.message.includes("duplicate")
    ) {
        statusCode = 409;
        code = "CONFLICT";
    } else if (
        err.message.includes("required") ||
        err.message.includes("validation")
    ) {
        statusCode = 400;
        code = "BAD_REQUEST";
    }

    res.status(statusCode).json({
        success: false,
        error: {
            message:
                process.env.NODE_ENV === "production"
                    ? "An unexpected error occurred"
                    : err.message,
            code,
        },
    });
}
