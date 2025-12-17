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

  downloadFile: async (fileId: number): Promise<Blob> => {
    const response = await api.get(`/api/files/${fileId}`, {
      responseType: 'blob', // Important for downloading files
    });
    return response.data;
  },

  getFilesByPostId: async (postId: number): Promise<FileResponse[]> => {
    const response = await api.get<FileResponse[]>(`/api/files/post/${postId}`);
    return response.data;
  },

  deleteFile: async (fileId: number): Promise<void> => {
    await api.delete(`/api/files/${fileId}`);
  },
};
