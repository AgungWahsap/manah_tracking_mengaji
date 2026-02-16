import api from '../lib/api';

/**
 * (Admin) Get all system settings.
 */
export const getSettings = async () => {
    const response = await api.get('/settings');
    return response;
};

/**
 * (Admin) Update multiple system settings.
 * @param {Array} settings - Array of setting objects to update
 */
export const updateSettings = async (settings) => {
    const response = await api.put('/settings', { settings });
    return response;
};

/**
 * Get prayer time offsets.
 */
export const getPrayerOffsets = async () => {
    const response = await api.get('/settings/prayer-offsets');
    return response;
};

/**
 * (Admin) Update prayer time offsets.
 * @param {object} data - Offset values
 */
export const updatePrayerOffsets = async (data) => {
    const response = await api.put('/settings/prayer-offsets', data);
    return response;
};

/**
 * (Admin) Reset today's attendance data.
 */
export const resetDailyAttendance = async () => {
    const response = await api.post('/settings/reset-daily-attendance');
    return response;
};

/**
 * (Admin) Unbind all devices.
 */
export const unbindAllDevices = async () => {
    const response = await api.post('/settings/unbind-all-devices');
    return response;
};

const settingsService = {
    getSettings, updateSettings,
    getPrayerOffsets, updatePrayerOffsets,
    resetDailyAttendance, unbindAllDevices,
};
export default settingsService;
