// frontend/src/api/adminApi.ts
import api from './api';
import type { User } from '../context/AuthContext';
import type { PostResponse, Page } from './postApi';
import type { CommentResponse } from './commentApi';

export interface AdminUserDetailResponse {
    user: User;
    posts: PostResponse[];
    comments: CommentResponse[];
}

/**
 * Fetches all users from the admin endpoint.
 * Requires the admin user's ID for authorization.
 * @param adminId - The ID of the administrator making the request.
 * @returns A promise that resolves to an array of User objects.
 */
export const getAllUsers = async (): Promise<User[]> => {
    try {
        const response = await api.get<User[]>('/api/admin/users');
        return response.data;
    } catch (error) {
        console.error("Error fetching all users:", error);
        throw error;
    }
};

/**
 * Fetches detailed information for a specific user as an admin.
 * @param userId - The ID of the user to fetch details for.
 * @returns A promise that resolves to an AdminUserDetailResponse object.
 */
export const getAdminUserDetails = async (userId: number): Promise<AdminUserDetailResponse> => {
    try {
        const response = await api.get<AdminUserDetailResponse>(`/api/admin/users/${userId}/details`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching user details for user ${userId}:`, error);
        throw error;
    }
};

/**
 * Updates a user's information by an admin.
 * @param userId - The ID of the user to update.
 * @param data - The data to update, e.g., { username: string }.
 * @returns A promise that resolves to the updated User object.
 */
export const updateUserByAdmin = async (userId: number, data: { username: string }): Promise<User> => {
    try {
        const response = await api.put<User>(`/api/admin/users/${userId}`, data);
        return response.data;
    } catch (error) {
        console.error(`Error updating user ${userId}:`, error);
        throw error;
    }
};

/**
 * Resets a user's password by an admin.
 * @param userId - The ID of the user whose password to reset.
 * @param newPassword - The new password.
 * @returns A promise that resolves to the success message.
 */
export const resetPasswordByAdmin = async (userId: number, newPassword: string): Promise<string> => {
    try {
        const response = await api.put<string>(
            `/api/admin/users/${userId}/reset-password`,
            { newPassword }
        );
        return response.data;
    } catch (error) {
        console.error(`Error resetting password for user ${userId}:`, error);
        throw error;
    }
};

/**
 * Fetches all posts, including secret ones, for an admin.
 * @returns A promise that resolves to a Page of PostResponse objects.
 */
export const getAllPostsForAdmin = async (page: number = 0, size: number = 1000): Promise<Page<PostResponse>> => {
    try {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('size', size.toString());
        params.append('sort', 'createdAt,desc');

        const response = await api.get<Page<PostResponse>>(`/api/admin/posts?${params.toString()}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching all posts for admin:", error);
        throw error;
    }
};

/**
 * Deletes any post by an admin.
 * @param postId - The ID of the post to delete.
 * @returns A promise that resolves when the deletion is complete.
 */
export const deletePostByAdmin = async (postId: number): Promise<void> => {
    try {
        await api.delete(`/api/admin/posts/${postId}`);
    } catch (error) {
        console.error(`Error deleting post ${postId} by admin:`, error);
        throw error;
    }
};

const adminApi = {
    getAllUsers,
    getAdminUserDetails,
    updateUserByAdmin,
    resetPasswordByAdmin,
    getAllPostsForAdmin,
    deletePostByAdmin,
};

export default adminApi;
