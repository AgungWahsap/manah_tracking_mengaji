import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getProfile,
    updateProfile,
    updateAvatar,
    listUsers,
    createUser,
    getUserById,
    updateUser,
    deleteUser,
} from '../services/user.service';

// ─── Query Keys ──────────────────────────────────────────────────────
export const userKeys = {
    all: ['users'],
    profile: () => ['users', 'me'],
    list: (params) => ['users', 'list', params],
    detail: (id) => ['users', 'detail', id],
};

// ─── Queries ─────────────────────────────────────────────────────────

/**
 * Fetch current user's profile.
 */
export function useProfile() {
    return useQuery({
        queryKey: userKeys.profile(),
        queryFn: getProfile,
    });
}

/**
 * (Admin) List all users with pagination and filters.
 * @param {object} params - { page, limit, search, role, status }
 */
export function useUsersList(params = {}) {
    return useQuery({
        queryKey: userKeys.list(params),
        queryFn: () => listUsers(params),
    });
}

/**
 * (Admin) Get a single user by ID.
 * @param {string} id - User ID
 */
export function useUser(id) {
    return useQuery({
        queryKey: userKeys.detail(id),
        queryFn: () => getUserById(id),
        enabled: !!id,
    });
}

// ─── Mutations ───────────────────────────────────────────────────────

/**
 * Update current user's profile.
 */
export function useUpdateProfile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data) => updateProfile(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.profile() });
        },
    });
}

/**
 * Update current user's avatar.
 */
export function useUpdateAvatar() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (imageUrl) => updateAvatar(imageUrl),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.profile() });
        },
    });
}

/**
 * (Admin) Create a new user.
 */
export function useCreateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data) => createUser(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.all });
        },
    });
}

/**
 * (Admin) Update a user by ID.
 */
export function useUpdateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }) => updateUser(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.all });
        },
    });
}

/**
 * (Admin) Delete a user by ID.
 */
export function useDeleteUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id) => deleteUser(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.all });
        },
    });
}
