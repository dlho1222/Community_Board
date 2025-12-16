import api from './api';

// Define interfaces for Post related data, matching the backend DTOs

export interface PostResponse {
    id: number;
    title: string;
    content: string;
    authorId: number; // Added for authorization checks on frontend
    authorName: string;
    createdAt: string; // Assuming ISO string format for Date/Time
    updatedAt: string; // Assuming ISO string format for Date/Time
    secret: boolean;
}

export interface PostCreateRequest {
    title: string;
    content: string;
    userId: number;
    secret: boolean;
}

export interface PostUpdateRequest {
    title: string;
    content: string;
    secret: boolean;
}

const postApi = {
    getAllPosts: async (): Promise<PostResponse[]> => {
        const response = await api.get<PostResponse[]>('/api/posts');
        return response.data;
    },

    getPostById: async (id: number): Promise<PostResponse> => {
        const response = await api.get<PostResponse>(`/api/posts/${id}`);
        return response.data;
    },

    createPost: async (postData: PostCreateRequest): Promise<PostResponse> => {
        const response = await api.post<PostResponse>('/api/posts', postData);
        return response.data;
    },

    updatePost: async (id: number, postData: PostUpdateRequest): Promise<PostResponse> => {
        const response = await api.put<PostResponse>(`/api/posts/${id}`, postData);
        return response.data;
    },

    deletePost: async (id: number): Promise<void> => {
        await api.delete(`/api/posts/${id}`);
    },

    searchPosts: async (keyword: string): Promise<PostResponse[]> => {
        const response = await api.get<PostResponse[]>(`/api/posts/search?keyword=${keyword}`);
        return response.data;
    },
};

export default postApi;
