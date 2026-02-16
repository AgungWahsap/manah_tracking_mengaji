import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import userService from '../services/user.service';

// ─── Query Keys ──────────────────────────────────────────────────────
export const userKeys = {
    all: ['users'],
    list: (params) => ['users', 'list', params],
    detail: (id) => ['users', 'detail', id],
    profile: () => ['users', 'profile'],
};

// ─── Hooks ───────────────────────────────────────────────────────────

/**
 * Fetch current user profile.
 */
export function useUserProfile() {
    return useQuery({
        queryKey: userKeys.profile(),
        queryFn: userService.getProfile,
    });
}

/**
 * (Admin) Fetch list of users with pagination/filters.
 * @param {Object} params - { page, limit, search, role, status }
 */
export function useUsers(params = {}) {
    return useQuery({
        queryKey: userKeys.list(params),
        queryFn: () => userService.listUsers(params),
        keepPreviousData: true,
    });
}

/**
 * (Admin) Create a new user (and auto-generate access code).
 */
export function useCreateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: userService.createUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.all });
        },
    });
}

/**
 * Update user profile (self or admin).
 */
export function useUpdateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }) => userService.updateUser(id, data),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: userKeys.all });
            queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) });
        },
    });
}

/**
 * Update CURRENT user profile (self).
 */
export function useUpdateProfile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: userService.updateProfile,
        onSuccess: (response) => {
            // Optimistically update the cache with the returned data
            // We merge with oldData to preserve joined fields (like asramaName) that might not be in the update response
            if (response?.success && response?.data) {
                queryClient.setQueryData(userKeys.profile(), (oldData) => {
                    return oldData ? { ...oldData, ...response.data } : response.data;
                });
            }

            queryClient.invalidateQueries({ queryKey: userKeys.profile() });
            queryClient.invalidateQueries({ queryKey: userKeys.all });
        },
    });
}

/**
 * (Admin) Delete a user.
 */
export function useDeleteUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: userService.deleteUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.all });
        },
    });
}
