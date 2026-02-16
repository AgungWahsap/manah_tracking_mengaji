import api from '../lib/api';

/**
 * Login with a unique access code.
 * @param {string} code - The access code
 * @returns {Promise<object>} The API envelope { success, data: { token, user } }
 */
export const loginWithCode = async (code) => {
    const response = await api.post('/auth/login/code', { code });
    return response;
};

const authService = { loginWithCode };
export default authService;
