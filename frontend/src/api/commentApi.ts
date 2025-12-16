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
    getCommentsByPostId: async (postId: number): Promise<CommentResponse[]> => {
        const response = await api.get<CommentResponse[]>(`/api/comments/post/${postId}`);
        return response.data;
    },

    createComment: async (commentData: CommentCreateRequest): Promise<CommentResponse> => {
        const response = await api.post<CommentResponse>('/api/comments', commentData);
        return response.data;
    },

    updateComment: async (id: number, content: string): Promise<CommentResponse> => {
        // Backend expects raw string content for now, might change to DTO later
        const response = await api.put<CommentResponse>(`/api/comments/${id}`, content, {
            headers: {
                'Content-Type': 'text/plain', // Explicitly set content type for raw string body
            },
        });
        return response.data;
    },

    deleteComment: async (id: number): Promise<void> => {
        await api.delete(`/api/comments/${id}`);
    },
};

export default commentApi;
