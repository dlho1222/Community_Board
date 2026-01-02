import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import postApi from '../api/postApi';
import type { PostResponse } from '../api/postApi';
import commentApi from '../api/commentApi';
import type { CommentResponse } from '../api/commentApi';
import { AuthContext } from '../context/AuthContext';
import { fileApi } from '../api/fileApi';
import type { FileResponse } from '../api/fileApi';

// MUI Components
import {
    Container,
    Box,
    Button,
    Alert,
    CircularProgress,
    Card,
    CardContent,
    CardHeader,
    Typography,
    List,
    ListItem,
    ListItemText,
    TextField,
    Divider,
    IconButton,
    Link as MuiLink, // Alias MUI Link to avoid conflict with RouterLink
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import DeleteIcon from '@mui/icons-material/Delete';

const BoardDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);

  const [post, setPost] = useState<PostResponse | null>(null);
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [files, setFiles] = useState<FileResponse[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (!authContext) {
    return (
        <Container sx={{ mt: 4 }}>
            <Alert severity="error">Authentication context not found.</Alert>
        </Container>
    );
  }

  const { user } = authContext;
  const isAuthor = user && post && user.id === post.authorId;
  const isAdmin = user?.role === 'ADMIN';

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = 2;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const fetchPostAndRelatedData = useCallback(async () => {
    if (!id) {
      setError('Post ID is missing.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const postId = parseInt(id);
      const postData = await postApi.getPostById(postId, user?.id, isAdmin);
      setPost(postData);
      const commentsData = await commentApi.getCommentsByPostId(postId, user?.id, isAdmin);
      setComments(commentsData);
      const filesData = await fileApi.getFilesByPostId(postId, user?.id, isAdmin);
      setFiles(filesData);
    } catch (err: any) {
      console.error('Failed to fetch post or comments:', err);
      if (err.response && err.response.data && err.response.data.message) {
          setError(err.response.data.message);
      } else if (err.response && err.response.data) {
          setError(err.response.data);
      }
      else {
          setError('Failed to load post or comments. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  }, [id, user?.id, isAdmin]);


  useEffect(() => {
    fetchPostAndRelatedData();
  }, [fetchPostAndRelatedData]);

  useEffect(() => {
    if (user && post) {
      console.log('--- Debugging isAuthor ---');
      console.log('Logged in User:', user);
      console.log('User ID (user.id):', user.id, 'Type:', typeof user.id);
      console.log('Post:', post);
      console.log('Post Author ID (post.authorId):', post.authorId, 'Type:', typeof post.authorId);
      console.log('Comparison (user.id === post.authorId):', user.id === post.authorId);
      console.log('Comparison (Number(user.id) === post.authorId):', Number(user.id) === post.authorId);
      console.log('isAdmin:', isAdmin);
      console.log('isAuthor or isAdmin:', isAuthor || isAdmin);
      console.log('--------------------------');
    }
  }, [user, post, isAuthor, isAdmin]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !post || !newComment.trim()) {
      return;
    }

    try {
      const newCommentData = await commentApi.createComment({
        content: newComment,
        userId: user.id,
        postId: post.id,
      }, user.id, isAdmin);
      setComments([...comments, newCommentData]);
      setNewComment('');
    } catch (err: any) {
      console.error('Failed to create comment:', err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to post comment. Please try again.');
      }
    }
  };

  const handleCommentDelete = async (commentId: number) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }
    try {
      await commentApi.deleteComment(commentId, user?.id, isAdmin);
      setComments(comments.filter((comment) => comment.id !== commentId));
    } catch (err: any) {
      console.error('Failed to delete comment:', err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to delete comment. Please try again.');
      }
    }
  };

  const handleDelete = async () => {
    if (!post || !window.confirm('Are you sure you want to delete this post?')) {
      return;
    }
    try {
      setLoading(true);
      await postApi.deletePost(post.id, user?.id, isAdmin);
      navigate('/board');
    } catch (err: any) {
      console.error('Failed to delete post:', err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to delete post. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileDownload = async (fileId: number, fileName: string) => {
    try {
      const blob = await fileApi.downloadFile(fileId, user?.id, isAdmin);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Failed to download file:', err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to download file. Please try again.');
      }
    }
  };

  const handleFileDelete = async (fileId: number) => {
    if (!window.confirm('Are you sure you want to delete this file?')) {
      return;
    }
    try {
      await fileApi.deleteFile(fileId, user?.id, isAdmin);
      setFiles(files.filter(file => file.id !== fileId));
    } catch (err: any) {
      console.error('Failed to delete file:', err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to delete file. Please try again.');
      }
    }
  };


  if (loading) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography>Loading post...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!post) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="info">Post not found.</Alert>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 4 }}>
      <Card>
        <CardHeader
          title={post.secret ? '비밀글입니다.' : post.title}
          titleTypographyProps={{ variant: 'h5' }}
        />
        <CardContent>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            작성자: {post.authorName} | 작성일: {new Date(post.createdAt).toLocaleDateString()}
          </Typography>
          <Typography variant="body1" paragraph>
            {post.secret && !(isAuthor || isAdmin)
              ? '이 글은 비밀글입니다. 작성자 또는 관리자만 내용을 볼 수 있습니다.'
              : post.content}
          </Typography>

          {/* Files Section */}
          {files.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>첨부 파일</Typography>
              <List>
                {files.map((file) => (
                  <ListItem key={file.id} secondaryAction={
                    (isAuthor || isAdmin) && (
                      <IconButton edge="end" aria-label="delete" onClick={() => handleFileDelete(file.id)}>
                        <DeleteIcon />
                      </IconButton>
                    )
                  }>
                    <MuiLink component="button" variant="body2" onClick={() => handleFileDownload(file.id, file.fileName)} sx={{ display: 'flex', alignItems: 'center', p: 0 }}>
                      <DescriptionIcon sx={{ mr: 1 }} />
                      <ListItemText primary={`${file.fileName} (${formatFileSize(file.fileSize)})`} />
                    </MuiLink>
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {/* Edit and Delete buttons */}
          {(isAuthor || isAdmin) && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, mb: 4 }}>
              <Button variant="outlined" color="secondary" sx={{ mr: 2 }} onClick={() => navigate(`/board/edit/${post.id}`)} disabled={loading}>Edit</Button>
              <Button variant="contained" color="error" onClick={handleDelete} disabled={loading}>Delete</Button>
            </Box>
          )}

          <Divider sx={{ my: 4 }} />

          {/* Comments Section */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>댓글</Typography>
            <List>
              {comments.map((comment) => (
                <ListItem key={comment.id} divider secondaryAction={
                    (user?.id === comment.userId || isAdmin) && (
                      <IconButton edge="end" aria-label="delete" onClick={() => handleCommentDelete(comment.id)}>
                        <DeleteIcon />
                      </IconButton>
                    )
                  }>
                  <ListItemText
                    primary={
                      <>
                        <Typography component="span" variant="body2" fontWeight="bold">
                          {comment.authorName}
                        </Typography>
                        <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                          {new Date(comment.createdAt).toLocaleString()}
                        </Typography>
                      </>
                    }
                    secondary={comment.content}
                  />
                </ListItem>
              ))}
            </List>

            {/* New Comment Form */}
            {user && (!post.secret || isAuthor || isAdmin) && (
              <Box component="form" sx={{ mt: 4 }} onSubmit={handleCommentSubmit}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="댓글 작성"
                  placeholder="댓글을 입력하세요."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <Button variant="contained" type="submit" color="primary">
                  등록
                </Button>
              </Box>
            )}
          </Box>
          
          <Button variant="contained" onClick={() => navigate('/board')} disabled={loading} sx={{ mt: 4 }}>
            목록으로
          </Button>
        </CardContent>
      </Card>
    </Container>
  );
};

export default BoardDetailPage;
