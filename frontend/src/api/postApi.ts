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

// Interface for Spring Data Page object
export interface Page<T> {
    content: T[];
    pageable: {
        sort: {
            empty: boolean;
            sorted: boolean;
            unsorted: boolean;
        };
        offset: number;
        pageNumber: number;
        pageSize: number;
        paged: boolean;
        unpaged: boolean;
    };
    last: boolean;
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
    sort: {
        empty: boolean;
        sorted: boolean;
        unsorted: boolean;
    };
    first: boolean;
    numberOfElements: number;
    empty: boolean;
}

const postApi = {
    getAllPosts: async (currentUserId?: number, isAdmin?: boolean, page: number = 0, size: number = 10): Promise<Page<PostResponse>> => {
        const params = new URLSearchParams();
        if (currentUserId !== undefined && currentUserId !== null && !isNaN(currentUserId)) {
            params.append('currentUserId', currentUserId.toString());
        }
        if (isAdmin === true) {
            params.append('isAdmin', 'true');
        }
        params.append('page', page.toString());
        params.append('size', size.toString());
        params.append('sort', 'createdAt,desc'); // Default sort to newest first

        const response = await api.get<Page<PostResponse>>(`/api/posts?${params.toString()}`);
        return response.data;
    },

    getPostById: async (id: number, currentUserId?: number, isAdmin?: boolean): Promise<PostResponse> => {
        const params = new URLSearchParams();
        if (currentUserId !== undefined && currentUserId !== null && !isNaN(currentUserId)) {
            params.append('currentUserId', currentUserId.toString());
        }
        if (isAdmin === true) {
            params.append('isAdmin', 'true');
        }

        const response = await api.get<PostResponse>(`/api/posts/${id}?${params.toString()}`);
        return response.data;
    },

    createPost: async (postData: PostCreateRequest): Promise<PostResponse> => {
        const response = await api.post<PostResponse>('/api/posts', postData);
        return response.data;
    },

    updatePost: async (id: number, postData: PostUpdateRequest, currentUserId?: number, isAdmin?: boolean): Promise<PostResponse> => {
        const params = new URLSearchParams();
        if (currentUserId !== undefined && currentUserId !== null && !isNaN(currentUserId)) {
            params.append('currentUserId', currentUserId.toString());
        }
        if (isAdmin === true) {
            params.append('isAdmin', 'true');
        }

        const response = await api.put<PostResponse>(`/api/posts/${id}?${params.toString()}`, postData);
        return response.data;
    },

    deletePost: async (id: number, currentUserId?: number, isAdmin?: boolean): Promise<void> => {
        const params = new URLSearchParams();
        if (currentUserId !== undefined && currentUserId !== null && !isNaN(currentUserId)) {
            params.append('currentUserId', currentUserId.toString());
        }
        if (isAdmin === true) {
            params.append('isAdmin', 'true');
        }

        await api.delete(`/api/posts/${id}?${params.toString()}`);
    },

    searchPosts: async (keyword: string, currentUserId?: number, isAdmin?: boolean, page: number = 0, size: number = 10): Promise<Page<PostResponse>> => {
        const params = new URLSearchParams();
        params.append('keyword', keyword);
        if (currentUserId !== undefined && currentUserId !== null && !isNaN(currentUserId)) {
            params.append('currentUserId', currentUserId.toString());
        }
        if (isAdmin === true) {
            params.append('isAdmin', 'true');
        }
        params.append('page', page.toString());
        params.append('size', size.toString());
        params.append('sort', 'createdAt,desc'); // Default sort to newest first

        const response = await api.get<Page<PostResponse>>(`/api/posts/search?${params.toString()}`);
        return response.data;
    },
};

export default postApi;
