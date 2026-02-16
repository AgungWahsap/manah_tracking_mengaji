import api from '../lib/api';

export const sunnahService = {
    /**
     * Get today's sunnah practices for current user
     */
    getTodaySunnah: async () => {
        const response = await api.get('/sunnah/today');
        return response;
    },

    /**
     * Submit or toggle a sunnah practice
     * @param {Object} data - { practice, performed, date? }
     */
    submitSunnah: async (data) => {
        const response = await api.post('/sunnah', data);
        return response;
    },

    /**
     * Get sunnah report (Admin)
     * @param {Object} params - { startDate, endDate, role }
     */
    getReport: async (params) => {
        const response = await api.get('/sunnah/report', { params });
        return response;
    }
};

export default sunnahService;
