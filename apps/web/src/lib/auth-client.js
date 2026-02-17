import { createAuthClient } from 'better-auth/react';
import { inferAdditionalFields } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
    // PERBAIKAN UTAMA:
    // Gunakan string "/api/auth" saja.
    // Ini akan memaksa request melewati 'vercel.json' (Rewrite) yang sudah Anda buat.
    // Hasilnya: Browser menganggap ini "Satu Rumah", Cookie diterima!
    baseURL: "/api/auth",

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
    signIn,  // Saya tambahkan ini karena sering dipakai untuk login
    signOut,
    signUp   // Saya tambahkan ini jaga-jaga butuh register
} = authClient;