import { createAuthClient } from 'better-auth/react';
import { inferAdditionalFields } from 'better-auth/client/plugins';

// 🛠️ PERBAIKAN DI SINI:
// Kita ambil alamat website saat ini secara otomatis.
// Contoh di Vercel: "https://manah-tracking-web.vercel.app"
// Contoh di Laptop: "http://localhost:5173"
const currentBaseUrl = typeof window !== "undefined"
    ? window.location.origin
    : "http://localhost:5173";

export const authClient = createAuthClient({
    // Kita gabungkan jadi alamat lengkap.
    // Hasilnya: "https://manah-tracking-web.vercel.app/api/auth"
    // Ini akan diterima library, TAPI tetap lewat jalur Proxy/Rewrite Vercel!
    baseURL: `${currentBaseUrl}/api/auth`,

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
    signIn,
    signOut,
    signUp
} = authClient;