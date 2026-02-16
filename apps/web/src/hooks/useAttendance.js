import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceService } from '../services/attendance.service';

const { checkIn, submitPermit, getHistory, getStats, getGlobalRecap } = attendanceService;

// ─── Query Keys ──────────────────────────────────────────────────────
export const attendanceKeys = {
    all: ['attendance'],
    history: (params) => ['attendance', 'history', params],
    stats: () => ['attendance', 'stats'],
    global: (params) => ['attendance', 'global', params],
};

// ─── Queries ─────────────────────────────────────────────────────────

/**
 * Fetch current user's attendance history (paginated).
 * @param {object} params - { page, limit, startDate, endDate }
 */
export function useAttendanceHistory(params = {}) {
    return useQuery({
        queryKey: attendanceKeys.history(params),
        queryFn: () => getHistory(params),
    });
}

/**
 * Fetch current user's attendance statistics.
 */
export function useAttendanceStats() {
    return useQuery({
        queryKey: attendanceKeys.stats(),
        queryFn: getStats,
    });
}

/**
 * (Admin) Fetch global attendance recap grid.
 * @param {object} params - { page, limit, date, role, search }
 */
export function useGlobalRecap(params = {}) {
    return useQuery({
        queryKey: attendanceKeys.global(params),
        queryFn: () => getGlobalRecap(params),
    });
}

// ─── Mutations ───────────────────────────────────────────────────────

/**
 * Submit a check-in (HADIR).
 */
export function useCheckIn() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data) => checkIn(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
        },
    });
}

/**
 * Submit a permit/excuse (IJIN).
 */
export function useSubmitPermit() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data) => submitPermit(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
        },
    });
}
