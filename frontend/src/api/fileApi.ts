import api from './api';

export interface FileResponse {
  id: number;
  fileName: string;
  fileDownloadUri: string;
  fileType: string;
  fileSize: number;
}

export const fileApi = {
  uploadFile: async (file: File, postId?: number): Promise<FileResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    if (postId) {
      formData.append('postId', postId.toString());
    }

    const response = await api.post<FileResponse>('/api/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  downloadFile: async (fileId: number, currentUserId?: number, isAdmin?: boolean): Promise<Blob> => {
    const params = new URLSearchParams();
    if (currentUserId !== undefined) params.append('currentUserId', currentUserId.toString());
    if (isAdmin !== undefined) params.append('isAdmin', isAdmin.toString());

    const response = await api.get(`/api/files/${fileId}?${params.toString()}`, {
      responseType: 'blob', // Important for downloading files
    });
    return response.data;
  },

  getFilesByPostId: async (postId: number, currentUserId?: number, isAdmin?: boolean): Promise<FileResponse[]> => {
    const params = new URLSearchParams();
    if (currentUserId !== undefined) params.append('currentUserId', currentUserId.toString());
    if (isAdmin !== undefined) params.append('isAdmin', isAdmin.toString());

    const response = await api.get<FileResponse[]>(`/api/files/post/${postId}?${params.toString()}`);
    return response.data;
  },

  deleteFile: async (fileId: number, currentUserId?: number, isAdmin?: boolean): Promise<void> => {
    const params = new URLSearchParams();
    if (currentUserId !== undefined) params.append('currentUserId', currentUserId.toString());
    if (isAdmin !== undefined) params.append('isAdmin', isAdmin.toString());

    await api.delete(`/api/files/${fileId}?${params.toString()}`);
  },
};
