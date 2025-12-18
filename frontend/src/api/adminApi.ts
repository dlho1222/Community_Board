// frontend/src/api/adminApi.ts
import api from './api';
import type { User } from '../context/AuthContext';

/**
 * Fetches all users from the admin endpoint.
 * Requires the admin user's ID for authorization.
 * @param adminId - The ID of the administrator making the request.
 * @returns A promise that resolves to an array of User objects.
 */
export const getAllUsers = async (adminId: number): Promise<User[]> => {
    try {
        const response = await api.get<User[]>('/api/admin/users', {
            headers: {
                'X-USER-ID': adminId,
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching all users:", error);
        // It's often better to let the calling component handle the error UI
        throw error;
    }
};

/**
 * Updates a user's information by an admin.
 * @param adminId - The ID of the administrator making the request.
 * @param userId - The ID of the user to update.
 * @param data - The data to update, e.g., { username: string }.
 * @returns A promise that resolves to the updated User object.
 */
export const updateUserByAdmin = async (adminId: number, userId: number, data: { username: string }): Promise<User> => {
    try {
        const response = await api.put<User>(`/api/admin/users/${userId}`, data, {
            headers: {
                'X-USER-ID': adminId,
            },
        });
        return response.data;
    } catch (error) {
        console.error(`Error updating user ${userId}:`, error);
        throw error;
    }
};

/**
 * Resets a user's password by an admin.
 * @param adminId - The ID of the administrator making the request.
 * @param userId - The ID of the user whose password to reset.
 * @param newPassword - The new password.
 * @returns A promise that resolves to the success message.
 */
export const resetPasswordByAdmin = async (adminId: number, userId: number, newPassword: string): Promise<string> => {
    try {
        const response = await api.put<string>(
            `/api/admin/users/${userId}/reset-password`,
            { newPassword },
            {
                headers: {
                    'X-USER-ID': adminId,
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error(`Error resetting password for user ${userId}:`, error);
        throw error;
    }
};

/**
 * Fetches all posts, including secret ones, for an admin.
 * @param adminId - The ID of the administrator making the request.
 * @returns A promise that resolves to an array of PostResponse objects.
 */
export const getAllPostsForAdmin = async (adminId: number): Promise<PostResponse[]> => {
    try {
        const response = await api.get<PostResponse[]>('/api/admin/posts', {
            headers: {
                'X-USER-ID': adminId,
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching all posts for admin:", error);
        throw error;
    }
};

/**
 * Deletes any post by an admin.
 * @param adminId - The ID of the administrator making the request.
 * @param postId - The ID of the post to delete.
 * @returns A promise that resolves when the deletion is complete.
 */
export const deletePostByAdmin = async (adminId: number, postId: number): Promise<void> => {
    try {
        await api.delete(`/api/admin/posts/${postId}`, {
            headers: {
                'X-USER-ID': adminId,
            },
        });
    } catch (error) {
        console.error(`Error deleting post ${postId} by admin:`, error);
        throw error;
    }
};

const adminApi = {
    getAllUsers,
    updateUserByAdmin,
    resetPasswordByAdmin,
    getAllPostsForAdmin,
    deletePostByAdmin,
};

export default adminApi;
