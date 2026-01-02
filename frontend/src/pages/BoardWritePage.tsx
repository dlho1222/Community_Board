import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import postApi from '../api/postApi';
import type { PostCreateRequest, PostUpdateRequest } from '../api/postApi';
import { AuthContext } from '../context/AuthContext';
import { fileApi } from '../api/fileApi';
import type { FileResponse } from '../api/fileApi';

// MUI Components
import {
    Container,
    Box,
    TextField,
    Button,
    Card,
    CardContent,
    Typography,
    Alert,
    CircularProgress,
    Checkbox,
    FormControlLabel,
    List,
    ListItem,
    ListItemText,
    IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { styled } from '@mui/material/styles';

const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
});

const BoardWritePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = id !== undefined && id !== '';
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [secret, setSecret] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [existingFiles, setExistingFiles] = useState<FileResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  if (!authContext) {
    return (
        <Container sx={{ mt: 4 }}>
            <Alert severity="error">Authentication context not found.</Alert>
        </Container>
    );
  }

  const { user } = authContext;
  const isAdmin = user?.role === 'ADMIN';

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = 2;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const fetchPostAndFiles = useCallback(async (currentUserId?: number, isAdmin?: boolean) => {
    if (!id) {
      setError('Post ID is missing.');
      setInitialLoading(false);
      return;
    }
    try {
      setInitialLoading(true);
      const postId = parseInt(id);
      const post = await postApi.getPostById(postId, currentUserId, isAdmin);
      setTitle(post.title);
      setContent(post.content);
      setSecret(post.secret);

      const filesData = await fileApi.getFilesByPostId(postId, currentUserId, isAdmin);
      setExistingFiles(filesData);
    } catch (err: any) {
      console.error('Failed to fetch post or files for editing:', err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to load post or files for editing. No response from server.');
      }
    } finally {
      setInitialLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isEditing) {
      fetchPostAndFiles(user?.id, isAdmin);
    } else {
      setInitialLoading(false);
    }
  }, [isEditing, fetchPostAndFiles, user?.id, isAdmin]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(e.target.files);
  };

  const handleDeleteExistingFile = async (fileId: number) => {
    if (!window.confirm('Are you sure you want to delete this file?')) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await fileApi.deleteFile(fileId, user?.id, isAdmin);
      setExistingFiles(existingFiles.filter(file => file.id !== fileId));
    } catch (err: any) {
      console.error('Failed to delete file:', err);
      if (err.response) {
        setError(err.response.data.message || 'Error deleting file.');
      } else {
        setError('Error deleting file. No response from server.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!user) {
      setError('You must be logged in to create or edit a post.');
      setLoading(false);
      return;
    }

    try {
      let postId: number;
      if (isEditing && id) {
        const updatedPost: PostUpdateRequest = { title, content, secret };
        await postApi.updatePost(parseInt(id), updatedPost, user?.id, isAdmin);
        postId = parseInt(id);
      } else {
        const newPost: PostCreateRequest = { title, content, userId: user.id, secret };
        const response = await postApi.createPost(newPost);
        postId = response.id;
      }

      if (selectedFiles && selectedFiles.length > 0) {
        for (let i = 0; i < selectedFiles.length; i++) {
          await fileApi.uploadFile(selectedFiles[i], postId);
        }
      }

      navigate(`/board/${postId}`);
    } catch (err: any) {
      console.error('Failed to save post or upload files:', err);
      if (err.response) {
        setError(err.response.data.message || 'Error saving post or uploading files.');
      } else {
        setError('Error saving post or uploading files. No response from server.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography>Loading post data...</Typography>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 4 }}>
      <Card>
        <CardContent>
          <Typography variant="h5" component="h1" align="center" sx={{ mb: 4 }}>
            {isEditing ? '게시글 수정' : '게시글 작성'}
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="postTitle"
              label="제목"
              placeholder="제목을 입력하세요"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
              sx={{ mb: 2 }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              multiline
              rows={10}
              id="postContent"
              label="내용"
              placeholder="내용을 입력하세요"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={loading}
              sx={{ mb: 2 }}
            />

            {isEditing && existingFiles.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>첨부된 파일</Typography>
                <List dense>
                  {existingFiles.map((file) => (
                    <ListItem
                      key={file.id}
                      secondaryAction={
                        <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteExistingFile(file.id)} disabled={loading}>
                          <DeleteIcon />
                        </IconButton>
                      }
                    >
                      <ListItemText primary={`${file.fileName} (${formatFileSize(file.fileSize)})`} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>파일 추가</Typography>
              <Button
                component="label"
                variant="contained"
                startIcon={<CloudUploadIcon />}
                disabled={loading}
              >
                파일 선택
                <VisuallyHiddenInput type="file" multiple onChange={handleFileChange} />
              </Button>
              {selectedFiles && selectedFiles.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                          {Array.from(selectedFiles).map(file => file.name).join(', ')}
                      </Typography>
                  </Box>
              )}
            </Box>

            <FormControlLabel
              control={
                <Checkbox
                  checked={secret}
                  onChange={(e) => setSecret(e.target.checked)}
                  disabled={loading}
                />
              }
              label="비밀글"
              sx={{ mb: 3 }}
            />

            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={loading}
              >
                {loading ? (isEditing ? '수정 중...' : '작성 중...') : (isEditing ? '수정 완료' : '작성 완료')}
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                fullWidth
                onClick={() => navigate(-1)}
                disabled={loading}
              >
                취소
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default BoardWritePage;
