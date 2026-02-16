import { createAuthClient } from 'better-auth/react';
import { inferAdditionalFields } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
    // LOGIKA BARU:
    // Mengecek apakah ada Environment Variable (VITE_API_URL) dari Vercel?
    // Jika YA: Gunakan URL Backend Vercel + /api/auth
    // Jika TIDAK: Gunakan localhost (untuk development di laptop)
    baseURL: import.meta.env.VITE_API_URL
        ? `${import.meta.env.VITE_API_URL}/api/auth`
        : "http://localhost:5173/api/auth",

    plugins: [
        inferAdditionalFields({
            user: {
                role: { type: "string" },
                nis: { type: "string" },
                asramaId: { type: "string" },
            }
        })
    ]
});

export const {
    useSession,
    signOut,
} = authClient;