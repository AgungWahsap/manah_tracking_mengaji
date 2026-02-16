import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    generateReport,
    getExportHistory,
    downloadExport,
} from '../services/export.service';

// ─── Query Keys ──────────────────────────────────────────────────────
export const exportKeys = {
    all: ['exports'],
    history: (params) => ['exports', 'history', params],
};

// ─── Queries ─────────────────────────────────────────────────────────

/**
 * (Admin) Fetch export history (paginated).
 * @param {object} params - { page, limit }
 */
export function useExportHistory(params = {}) {
    return useQuery({
        queryKey: exportKeys.history(params),
        queryFn: () => getExportHistory(params),
    });
}

// ─── Mutations ───────────────────────────────────────────────────────

/**
 * (Admin) Generate and download a report.
 */
export function useGenerateReport() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data) => generateReport(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: exportKeys.all });
        },
    });
}

/**
 * (Admin) Get download info for a past export.
 */
export function useDownloadExport() {
    return useMutation({
        mutationFn: (id) => downloadExport(id),
    });
}
