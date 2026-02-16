import api from '../lib/api';

/**
 * (Admin) Generate and download a report.
 * @param {object} data - { format, dateRange, dataType, ... }
 */
export const generateReport = async (data) => {
    const response = await api.post('/exports/generate', data);
    return response;
};

/**
 * (Admin) Get export history (paginated).
 * @param {object} params - { page, limit }
 */
export const getExportHistory = async (params = {}) => {
    const response = await api.get('/exports/history', { params });
    return response;
};

/**
 * (Admin) Get download info for a past export.
 * @param {string} id - Export record ID
 */
export const downloadExport = async (id) => {
    const response = await api.get(`/exports/${id}/download`);
    return response;
};

const exportService = { generateReport, getExportHistory, downloadExport };
export default exportService;
