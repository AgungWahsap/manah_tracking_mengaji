import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import db from "../db/index.js";
import * as schema from "../db/schema.js";
import { eq, and } from "drizzle-orm";

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

    // PENTING: Saya sudah tambahkan URL Frontend Vercel di sini
    trustedOrigins: [
        "https://manah-tracking-web.vercel.app",
        "http://localhost:5173"
    ],

    // Baris di bawah ini berfungsi untuk MEMBUNGKAM error merah di editor
    // @ts-ignore 
    advanced: {
        cookie: {
            secure: true,
            sameSite: "none",
            httpOnly: true
        }
    }
});

export type Auth = typeof auth;