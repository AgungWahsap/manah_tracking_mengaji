import { Request, Response, NextFunction } from "express";
import db from "../db/index.js";
import * as schema from "../db/schema.js";
import { eq } from "drizzle-orm";

// Extend Express Request to include user
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                name: string;
                email: string;
                role: string;
                [key: string]: any;
            };
        }
    }
}

import { auth } from "../auth/index.js";

/**
 * Middleware that validates the session via Cookie or Bearer token using Better-Auth.
 * Attaches `req.user` with the authenticated user's data.
 */
export async function requireAuth(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const session = await auth.api.getSession({
            headers: req.headers as unknown as HeadersInit,
        });

        if (!session || !session.user) {
            res.status(401).json({
                success: false,
                error: { message: "Unauthorized. Missing or invalid session.", code: "UNAUTHORIZED" },
            });
            return;
        }

        // Fetch full user from DB to ensure we have 'role' and other custom fields
        // Better-Auth session.user might only contain basic fields
        const [user] = await db
            .select()
            .from(schema.user)
            .where(eq(schema.user.id, session.user.id))
            .limit(1);

        if (!user) {
            res.status(401).json({
                success: false,
                error: { message: "Unauthorized. User not found.", code: "UNAUTHORIZED" },
            });
            return;
        }

        req.user = user;
        next();
    } catch (error) {
        console.error("Auth middleware error:", error);
        res.status(401).json({
            success: false,
            error: { message: "Invalid session.", code: "INVALID_SESSION" },
        });
    }
}

/**
 * Middleware that checks if the authenticated user has admin role.
 * Must be used AFTER `requireAuth`.
 */
export function requireAdmin(
    req: Request,
    res: Response,
    next: NextFunction
): void {


    if (!req.user || req.user.role !== "admin") {
        res.status(403).json({
            success: false,
            error: {
                message: "Forbidden. Admin access required.",
                code: "FORBIDDEN",
            },
        });
        return;
    }
    next();
}
