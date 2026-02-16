import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getSettings,
    updateSettings,
    getPrayerOffsets,
    updatePrayerOffsets,
    resetDailyAttendance,
    unbindAllDevices,
} from '../services/settings.service';

// ─── Query Keys ──────────────────────────────────────────────────────
export const settingsKeys = {
    all: ['settings'],
    settings: () => ['settings', 'all'],
    prayerOffsets: () => ['settings', 'prayer-offsets'],
};

// ─── Queries ─────────────────────────────────────────────────────────

/**
 * (Admin) Fetch all system settings.
 */
export function useSettings() {
    return useQuery({
        queryKey: settingsKeys.settings(),
        queryFn: getSettings,
    });
}

/**
 * Fetch prayer time offsets.
 */
export function usePrayerOffsets() {
    return useQuery({
        queryKey: settingsKeys.prayerOffsets(),
        queryFn: getPrayerOffsets,
    });
}

// ─── Mutations ───────────────────────────────────────────────────────

/**
 * (Admin) Update multiple system settings.
 */
export function useUpdateSettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (settings) => updateSettings(settings),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsKeys.all });
        },
    });
}

/**
 * (Admin) Update prayer time offsets.
 */
export function useUpdatePrayerOffsets() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data) => updatePrayerOffsets(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsKeys.all });
        },
    });
}

/**
 * (Admin) Danger: Reset today's attendance data.
 */
export function useResetDailyAttendance() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: resetDailyAttendance,
        onSuccess: () => {
            queryClient.invalidateQueries();
        },
    });
}

/**
 * (Admin) Danger: Unbind all devices.
 */
export function useUnbindAllDevices() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: unbindAllDevices,
        onSuccess: () => {
            queryClient.invalidateQueries();
        },
    });
}
