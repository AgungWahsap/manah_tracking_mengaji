import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { codeService } from '../services/code.service';

const { listCodes, createCode, updateCode, deleteCode } = codeService;

// ─── Query Keys ──────────────────────────────────────────────────────
export const codeKeys = {
    all: ['codes'],
    list: (params) => ['codes', 'list', params],
};

// ─── Queries ─────────────────────────────────────────────────────────

/**
 * (Admin) List access codes with pagination and filters.
 * @param {object} params - { page, limit, search, role, status }
 */
export function useCodesList(params = {}) {
    return useQuery({
        queryKey: codeKeys.list(params),
        queryFn: () => listCodes(params),
    });
}

// ─── Mutations ───────────────────────────────────────────────────────

/**
 * (Admin) Create a new access code.
 */
export function useCreateCode() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data) => createCode(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: codeKeys.all });
        },
    });
}

/**
 * (Admin) Update an access code.
 */
export function useUpdateCode() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }) => updateCode(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: codeKeys.all });
        },
    });
}

/**
 * (Admin) Delete an access code.
 */
export function useDeleteCode() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id) => deleteCode(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: codeKeys.all });
        },
    });
}
