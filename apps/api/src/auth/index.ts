import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import db from "../db/index.js";
import * as schema from "../db/schema.js";
// import { eq, and } from "drizzle-orm"; // Tidak dipakai, boleh dihapus

import { bearer } from "better-auth/plugins";
import { codeLoginPlugin } from "./code-login-plugin.js";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: {
            user: schema.user,
            session: schema.session,
            account: schema.account,
            verification: schema.verification,
        },
    }),
    emailAndPassword: {
        enabled: false,
    },
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // 1 day
    },
    plugins: [bearer(), codeLoginPlugin()],

    trustedOrigins: [
        ...(process.env.FRONTEND_URL || "http://localhost:5173")
            .split(",")
            .map((origin) => origin.trim())
            .filter(Boolean),
        "http://localhost:5173",
    ],

    // 🛠️ PERBAIKAN FINAL (Strategi Satu Rumah):
    advanced: {
        defaultCookieAttributes: {
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            httpOnly: true
        }
    }
});

export type Auth = typeof auth;