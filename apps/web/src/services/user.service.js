import api from '../lib/api';

/**
 * Get the current user's profile.
 */
export const getProfile = async () => {
    const response = await api.get('/users/me');
    return response.data;
};

/**
 * Update the current user's profile.
 * @param {object} data - Profile fields to update
 */
export const updateProfile = async (data) => {
    const response = await api.put('/users/me', data);
    return response;
};

/**
 * Update the current user's avatar.
 * @param {string} imageUrl - URL of the new avatar image
 */
export const updateAvatar = async (imageUrl) => {
    const response = await api.put('/users/me/avatar', { imageUrl });
    return response;
};

/**
 * (Admin) List all users with pagination and filters.
 * @param {object} params - { page, limit, search, role, status }
 */
export const listUsers = async (params = {}) => {
    const response = await api.get('/users', { params });
    return response;
};

/**
 * (Admin) Create a new user.
 * @param {object} data - User data
 */
export const createUser = async (data) => {
    const response = await api.post('/users', data);
    return response;
};

/**
 * (Admin) Get a user by ID.
 * @param {string} id - User ID
 */
export const getUserById = async (id) => {
    const response = await api.get(`/users/${id}`);
    return response;
};

/**
 * (Admin) Update a user by ID.
 * @param {string} id - User ID
 * @param {object} data - Fields to update
 */
export const updateUser = async (id, data) => {
    const response = await api.put(`/users/${id}`, data);
    return response;
};

/**
 * (Admin) Delete a user by ID.
 * @param {string} id - User ID
 */
export const deleteUser = async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response;
};

const userService = {
    getProfile, updateProfile, updateAvatar,
    listUsers, createUser, getUserById, updateUser, deleteUser,
};
export default userService;
