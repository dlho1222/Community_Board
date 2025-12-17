import api from './api';

export interface CommentResponse {
    id: number;
    content: string;
    userId: number;
    authorName: string;
    postId: number;
    createdAt: string;
    updatedAt: string;
}

export interface CommentCreateRequest {
    content: string;
    userId: number;
    postId: number;
}

const commentApi = {
    getCommentsByPostId: async (postId: number, currentUserId?: number, isAdmin?: boolean): Promise<CommentResponse[]> => {
        const params = new URLSearchParams();
        if (currentUserId !== undefined) params.append('currentUserId', currentUserId.toString());
        if (isAdmin !== undefined) params.append('isAdmin', isAdmin.toString());

        const response = await api.get<CommentResponse[]>(`/api/comments/post/${postId}?${params.toString()}`);
        return response.data;
    },

    createComment: async (commentData: CommentCreateRequest, currentUserId?: number, isAdmin?: boolean): Promise<CommentResponse> => {
        const params = new URLSearchParams();
        if (currentUserId !== undefined) params.append('currentUserId', currentUserId.toString());
        if (isAdmin !== undefined) params.append('isAdmin', isAdmin.toString());

        const response = await api.post<CommentResponse>(`/api/comments?${params.toString()}`, commentData);
        return response.data;
    },

    updateComment: async (id: number, content: string): Promise<CommentResponse> => {
        // In a real application, you might want a DTO for update with validation
        const response = await api.put<CommentResponse>(`/api/comments/${id}`, content, {
            headers: {
                'Content-Type': 'text/plain', // Explicitly set content type for raw string body
            },
        });
        return response.data;
    },

    deleteComment: async (id: number, currentUserId?: number, isAdmin?: boolean): Promise<void> => {
        const params = new URLSearchParams();
        if (currentUserId !== undefined) params.append('currentUserId', currentUserId.toString());
        if (isAdmin !== undefined) params.append('isAdmin', isAdmin.toString());

        await api.delete(`/api/comments/${id}?${params.toString()}`);
    },
};

export default commentApi;
