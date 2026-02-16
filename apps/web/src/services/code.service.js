import api from '../lib/api';

export const codeService = {
    // List all access codes with pagination
    listCodes: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        const response = await api.get(`/codes?${query}`);
        return response;
    },

    // Create a new access code
    createCode: async (data) => {
        const response = await api.post('/codes', data);
        return response;
    },

    // Update an access code
    updateCode: async (id, data) => {
        const response = await api.put(`/codes/${id}`, data);
        return response;
    },

    // Delete an access code
    deleteCode: async (id) => {
        const response = await api.delete(`/codes/${id}`);
        return response;
    }
};

export default codeService;
