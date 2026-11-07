import api from '../lib/api';

export const recitationService = {
    getClasses: async ({ includeInactive = false } = {}) => api.get('/recitation/classes', {
        params: { includeInactive },
    }),
    createClass: async (name) => api.post('/recitation/classes', { name }),
    updateClass: async (id, data) => api.patch(`/recitation/classes/${id}`, data),
    exportClassTemplate: async (id) => api.get(`/recitation/classes/${id}/template`, { responseType: 'blob' }),
    importClassStudents: async (id, fileBase64) => api.post(`/recitation/classes/${id}/import`, { fileBase64 }),
    getSessions: async () => api.get('/recitation/sessions'),
    getAttendanceSetup: async () => api.get('/recitation/attendance/setup'),
    updateSessions: async (updates) => api.put('/recitation/sessions', { updates }),
    getStudents: async ({ search = '', includeInactive = false, classId } = {}) => api.get('/recitation/students', {
        params: { search, includeInactive, ...(classId ? { classId } : {}) },
    }),
    createStudent: async (student) => api.post('/recitation/students', student),
    updateStudent: async (id, student) => api.patch(`/recitation/students/${id}`, student),
    getAttendance: async (date, sessionId, classId) => api.get('/recitation/attendance', {
        params: { date, sessionId, classId },
    }),
    saveAttendance: async (data) => api.put('/recitation/attendance', data),
    getRecap: async (params) => api.get('/recitation/recap', { params }),
    exportRecap: async (params) => api.get('/recitation/recap/export', {
        params,
        responseType: 'blob',
    }),
};
