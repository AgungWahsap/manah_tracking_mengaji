import api from '../lib/api';

/**
 * Service to handle attendance operations.
 * NOTE: The axios interceptor in api.js already unwraps response.data,
 * so `response` here IS the API envelope { success, data, ... }.
 */
export const attendanceService = {
    /**
     * Submit attendance check-in (HADIR)
     * @param {Object} data - Attendance data { prayerTimeId, location, method, selfieUrl, latitude, longitude }
     * @returns {Promise<Object>} API envelope
     */
    checkIn: async (data) => {
        const response = await api.post('/attendance/check-in', data);
        return response;
    },

    /**
     * Submit permit request (IJIN)
     * @param {Object} data - Permit data { date, type, reason, isFullDay }
     * @returns {Promise<Object>} API envelope
     */
    submitPermit: async (data) => {
        const response = await api.post('/attendance/permit', data);
        return response;
    },

    /**
     * (Admin) Approve/Reject permit
     * @param {string} id - Permit ID
     * @param {string} status - 'approved' | 'rejected'
     */
    updatePermit: async (id, status) => {
        const response = await api.put(`/attendance/permit/${id}`, { status });
        return response;
    },

    /**
     * Get user's attendance history
     * @param {Object} params - Query params { page, limit, startDate, endDate }
     * @returns {Promise<Object>} API envelope
     */
    getHistory: async (params) => {
        const response = await api.get('/attendance/history', { params });
        return response;
    },

    /**
     * Get user's attendance stats
     * @returns {Promise<Object>} API envelope
     */
    getStats: async (params) => {
        const response = await api.get('/attendance/stats', { params });
        return response;
    },

    /**
     * Get prayer times schedule (from dashboard)
     * @returns {Promise<Object>} API envelope
     */
    getPrayerTimes: async () => {
        const response = await api.get('/dashboard/prayer-times');
        return response;
    },

    /**
     * Update prayer times and offsets
     * @param {Object} updates - { subuh: { time: "04:30", offset: 20 }, ... }
     */
    updatePrayerTimes: async (updates) => {
        // Send as { updates: ... } to match backend expectation
        const response = await api.put('/dashboard/prayer-times', { updates });
        return response;
    },

    /**
     * (Admin) Get global attendance recap grid.
     * @param {Object} query - { page, limit, date, role, search }
     */
    getGlobalRecap: async (params) => {
        const response = await api.get('/attendance/global', { params });
        return response; // Correct: response IS the envelope (due to api.js interceptor)
    },

    getTodayStatus: async () => {
        const response = await api.get('/attendance/today-status');
        return response;
    },

    /**
     * (Admin) Reset daily attendance
     * @param {string} date - Date YYYY-MM-DD
     */
    resetDaily: async (date) => {
        const response = await api.delete('/attendance/daily', { params: { date } });
        return response;
    },

    /**
     * (Admin) Get attendance report for a period.
     * @param {Object} query - { startDate, endDate, role }
     */
    getReport: async (query) => {
        const response = await api.get('/attendance/report', { params: query });
        return response;
    },
    /**
     * (Admin) Bulk check-in for users
     * @param {Object} data - { prayerTimeId, userIds, date, status }
     */
    bulkCheckIn: async (data) => {
        const response = await api.post('/attendance/bulk', data);
        return response;
    },
};

export default attendanceService;
