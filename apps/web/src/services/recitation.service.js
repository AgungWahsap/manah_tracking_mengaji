import api from '../lib/api';

export const recitationService = {
    getSessions: async () => api.get('/recitation/sessions'),
    updateSessions: async (updates) => api.put('/recitation/sessions', { updates }),
    getStudents: async ({ search = '', includeInactive = false } = {}) => api.get('/recitation/students', {
        params: { search, includeInactive },
    }),
    createStudent: async (student) => api.post('/recitation/students', student),
    updateStudent: async (id, student) => api.patch(`/recitation/students/${id}`, student),
    getAttendance: async (date, sessionId) => api.get('/recitation/attendance', {
        params: { date, sessionId },
    }),
    saveAttendance: async (data) => api.put('/recitation/attendance', data),
    getRecap: async (params) => api.get('/recitation/recap', { params }),
};
