import db from "../db/index.js";
import * as schema from "../db/schema.js";
import { eq, and } from "drizzle-orm";

/**
 * Custom unique-code login handler.
 * Validates the access code from the `access_code` table,
 * finds the associated user, and creates a session via Better Auth.
 */
export async function loginWithUniqueCode(code: string) {
    // Find the access code in the database
    const [accessCodeRecord] = await db
        .select()
        .from(schema.accessCode)
        .where(
            and(
                eq(schema.accessCode.code, code.toUpperCase().replace(/\s/g, "")),
                eq(schema.accessCode.status, "active")
            )
        )
        .limit(1);

    if (!accessCodeRecord) {
        throw new Error("Invalid or inactive access code");
    }

    // Check if the code has expired
    if (accessCodeRecord.expiresAt && accessCodeRecord.expiresAt < new Date()) {
        throw new Error("Access code has expired");
    }

    // Check if the code is assigned to a user
    if (!accessCodeRecord.userId) {
        throw new Error("Access code is not assigned to any user");
    }

    // Get the associated user
    const [userRecord] = await db
        .select()
        .from(schema.user)
        .where(eq(schema.user.id, accessCodeRecord.userId))
        .limit(1);

    if (!userRecord) {
        throw new Error("User associated with this code not found");
    }

    if (userRecord.status !== "active") {
        throw new Error("User account is not active");
    }

    return userRecord;
}
