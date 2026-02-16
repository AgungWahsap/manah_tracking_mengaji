import { createAuthEndpoint } from "better-auth/api";
import { z } from "zod";
import { loginWithUniqueCode } from "../services/auth.service.js";
import db from "../db/index.js";
import * as schema from "../db/schema.js";
import { eq } from "drizzle-orm";
// Use dynamic import or require for better-auth/cookies if ESM issues arise, 
// but standard import should work with TS if moduleResolution is nodenext/bundler.
// However, the internal file structure usage might be tricky.
// Let's try standard import.
import { setSessionCookie } from "better-auth/cookies";

export const codeLoginPlugin = () => {
    return {
        id: "code-login",
        endpoints: {
            signInWithCode: createAuthEndpoint(
                "/login/code",
                {
                    method: "POST",
                    body: z.object({
                        code: z.string().min(1, "Access code is required"),
                    }),
                    metadata: {
                        openapi: {
                            description: "Sign in with unique access code",
                            responses: {
                                200: {
                                    description: "Success",
                                    content: {
                                        "application/json": {
                                            schema: {
                                                type: "object",
                                                properties: {
                                                    session: {
                                                        $ref: "#/components/schemas/Session",
                                                    },
                                                    user: {
                                                        $ref: "#/components/schemas/User",
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                async (ctx) => {
                    const { code } = ctx.body;

                    // Validate code and get user
                    // Using existing service logic
                    const user = await loginWithUniqueCode(code);

                    // Ensure user has a credential account (Better Auth requirement)
                    const [existingAccount] = await db
                        .select()
                        .from(schema.account)
                        .where(eq(schema.account.userId, user.id))
                        .limit(1);

                    if (!existingAccount) {
                        const crypto = await import("crypto");
                        await db.insert(schema.account).values({
                            id: crypto.randomUUID(),
                            accountId: user.id,
                            providerId: "credential",
                            userId: user.id,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        });
                    }

                    // Create session using internal adapter
                    const session = await ctx.context.internalAdapter.createSession(
                        user.id,
                        false // dontRememberMe
                    );

                    if (!session) {
                        throw new Error("Failed to create session");
                    }

                    // Set session cookie using Better Auth's utility
                    await setSessionCookie(ctx, {
                        session,
                        user
                    });

                    return ctx.json({
                        session: session,
                        user: user,
                    });
                }
            ),
        },
    };
};
