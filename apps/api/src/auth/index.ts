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
        "https://manah-tracking-web.vercel.app",
        "http://localhost:5173"
    ],

    // 🛠️ PERBAIKAN FINAL (Strategi Satu Rumah):
    advanced: {
        defaultCookieAttributes: {
            secure: true,
            // Kita ubah ke 'lax'. Karena kita sudah pakai Proxy (vercel.json), 
            // browser HP/Incognito akan lebih senang menerima cookie ini.
            sameSite: "lax",
            httpOnly: true
        }
    }
});

export type Auth = typeof auth;