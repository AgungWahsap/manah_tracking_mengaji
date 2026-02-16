import { useQuery } from '@tanstack/react-query';
import {
    getPrayerTimes,
    getWeeklyStats,
    getRecentActivity,
} from '../services/dashboard.service';

// ─── Query Keys ──────────────────────────────────────────────────────
export const dashboardKeys = {
    all: ['dashboard'],
    prayerTimes: () => ['dashboard', 'prayer-times'],
    weeklyStats: () => ['dashboard', 'weekly-stats'],
    recentActivity: (limit) => ['dashboard', 'recent-activity', limit],
};

// ─── Queries ─────────────────────────────────────────────────────────

/**
 * Fetch today's prayer schedule.
 */
export function usePrayerTimes() {
    return useQuery({
        queryKey: dashboardKeys.prayerTimes(),
        queryFn: getPrayerTimes,
    });
}

/**
 * Fetch current user's weekly attendance percentage.
 */
export function useWeeklyStats() {
    return useQuery({
        queryKey: dashboardKeys.weeklyStats(),
        queryFn: getWeeklyStats,
    });
}

/**
 * Fetch current user's recent activity.
 * @param {number} limit - Number of items (default 5)
 */
export function useRecentActivity(limit = 5) {
    return useQuery({
        queryKey: dashboardKeys.recentActivity(limit),
        queryFn: () => getRecentActivity(limit),
    });
}
