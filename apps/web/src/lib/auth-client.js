import { createAuthClient } from 'better-auth/react';
import { inferAdditionalFields } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
    baseURL: 'http://localhost:5173/api/auth',
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
