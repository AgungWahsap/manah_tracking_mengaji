import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession, signOut } from '../lib/auth-client';
import { loginWithCode } from '../services/auth.service';

/**
 * Re-export Better Auth's useSession hook.
 * Returns { data: session, isPending, error }.
 */
export { useSession };

/**
 * Mutation hook for logging in with a unique access code.
 * On success, invalidates the session query so Better Auth re-fetches it.
 */
export function useLoginWithCode() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (code) => loginWithCode(code),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['session'] });
        },
    });
}

/**
 * Mutation hook for logging out.
 * On success, clears all cached queries.
 */
export function useLogout() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => signOut(),
        onSuccess: () => {
            queryClient.clear();
        },
    });
}
