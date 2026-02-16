import api from '../lib/api';

/**
 * Get today's prayer schedule.
 * @returns {Promise<object>} API envelope
 */
export const getPrayerTimes = async () => {
    const response = await api.get('/dashboard/prayer-times');
    return response;
};

/**
 * Get the current user's weekly attendance stats.
 * @returns {Promise<object>} API envelope
 */
export const getWeeklyStats = async () => {
    const response = await api.get('/dashboard/weekly-stats');
    return response;
};

/**
 * Get the current user's recent activity.
 * @param {number} limit - Number of items to fetch (default 5)
 * @returns {Promise<object>} API envelope
 */
export const getRecentActivity = async (limit = 5) => {
    const response = await api.get('/dashboard/recent-activity', { params: { limit } });
    return response;
};

const dashboardService = { getPrayerTimes, getWeeklyStats, getRecentActivity };
export default dashboardService;
