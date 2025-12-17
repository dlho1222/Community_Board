import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Container, Card, Button, Alert, Spinner, ListGroup, Form } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import postApi from '../api/postApi';
import type { PostResponse } from '../api/postApi'; // Explicitly import type only
import commentApi from '../api/commentApi';
import type { CommentResponse } from '../api/commentApi';
import { AuthContext } from '../context/AuthContext'; // Import AuthContext
import { fileApi } from '../api/fileApi'; // Import fileApi and FileResponse
import type { FileResponse } from '../api/fileApi';

const BoardDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);

  const [post, setPost] = useState<PostResponse | null>(null);
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [files, setFiles] = useState<FileResponse[]>([]); // New state for files
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (!authContext) {
    // This should ideally not happen if the component is wrapped in AuthProvider
    return <Container className="mt-4"><Alert variant="danger">Authentication context not found.</Alert></Container>;
  }

  const { user } = authContext;
  const isAuthor = user && post && user.id === post.authorId;
  const isAdmin = user && user.username === 'admin'; // Simple admin check for now

  // Function to format file size
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
      const postData = await postApi.getPostById(postId);
      setPost(postData);
      const commentsData = await commentApi.getCommentsByPostId(postId);
      setComments(commentsData);
      const filesData = await fileApi.getFilesByPostId(postId); // Fetch files
      setFiles(filesData); // Set files state
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
  }, [id]);


  useEffect(() => {
    fetchPostAndRelatedData();
  }, [fetchPostAndRelatedData]);

  // Debugging logs for isAuthor
  useEffect(() => {
    if (user && post) {
      console.log('--- Debugging isAuthor ---');
      console.log('Logged in User:', user);
      console.log('User ID (user.id):', user.id, 'Type:', typeof user.id);
      console.log('Post:', post);
      console.log('Post Author ID (post.authorId):', post.authorId, 'Type:', typeof post.authorId);
      console.log('Comparison (user.id === post.authorId):', user.id === post.authorId);
      console.log('Comparison (Number(user.id) === post.authorId):', Number(user.id) === post.authorId);
      console.log('isAdmin:', isAdmin); // Check if isAdmin is working
      console.log('isAuthor or isAdmin:', isAuthor || isAdmin);
      console.log('--------------------------');
    }
  }, [user, post, isAuthor, isAdmin]);

  const handleCommentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !post || !newComment.trim()) {
      return;
    }

    try {
      const newCommentData = await commentApi.createComment({
        content: newComment,
        userId: user.id,
        postId: post.id,
      });
      setComments([...comments, newCommentData]);
      setNewComment('');
    } catch (err) {
      console.error('Failed to create comment:', err);
      setError('Failed to post comment. Please try again.');
    }
  };

  const handleCommentDelete = async (commentId: number) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }
    try {
      await commentApi.deleteComment(commentId);
      setComments(comments.filter((comment) => comment.id !== commentId));
    } catch (err) {
      console.error('Failed to delete comment:', err);
      setError('Failed to delete comment. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (!post || !window.confirm('Are you sure you want to delete this post?')) {
      return;
    }
    try {
      setLoading(true);
      await postApi.deletePost(post.id);
      navigate('/board'); // Redirect to board list after deletion
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
      const blob = await fileApi.downloadFile(fileId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName; // Use the original file name for download
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download file:', err);
      setError('Failed to download file. Please try again.');
    }
  };

  const handleFileDelete = async (fileId: number) => {
    if (!window.confirm('Are you sure you want to delete this file?')) {
      return;
    }
    try {
      await fileApi.deleteFile(fileId);
      setFiles(files.filter(file => file.id !== fileId)); // Update local state
    } catch (err) {
      console.error('Failed to delete file:', err);
      setError('Failed to delete file. Please try again.');
    }
  };


  if (loading) {
    return (
      <Container className="mt-4 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading post...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  if (!post) {
    return (
      <Container className="mt-4">
        <Alert variant="info">Post not found.</Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <Card>
        <Card.Header as="h5">{post.secret ? '비밀글입니다.' : post.title}</Card.Header>
        <Card.Body>
          <Card.Subtitle className="mb-2 text-muted">
            작성자: {post.authorName} | 작성일: {new Date(post.createdAt).toLocaleDateString()}
          </Card.Subtitle>
          <Card.Text>
            {post.secret && !(isAuthor || isAdmin)
              ? '이 글은 비밀글입니다. 작성자 또는 관리자만 내용을 볼 수 있습니다.'
              : post.content}
          </Card.Text>

          {/* Files Section */}
          {files.length > 0 && (
            <div className="mt-4">
              <h5>첨부 파일</h5>
              <ListGroup>
                {files.map((file) => (
                  <ListGroup.Item key={file.id} className="d-flex justify-content-between align-items-center">
                    <div>
                      <Button variant="link" onClick={() => handleFileDownload(file.id, file.fileName)} className="p-0 align-baseline">
                        {file.fileName} ({formatFileSize(file.fileSize)})
                      </Button>
                    </div>
                    {(isAuthor || isAdmin) && (
                      <Button variant="danger" size="sm" onClick={() => handleFileDelete(file.id)}>
                        삭제
                      </Button>
                    )}
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </div>
          )}

          {/* Edit and Delete buttons */}
          {(isAuthor || isAdmin) && (
            <div className="d-flex justify-content-end mb-3 mt-4">
              <Button variant="secondary" className="me-2" onClick={() => navigate(`/board/edit/${post.id}`)} disabled={loading}>Edit</Button>
              <Button variant="danger" onClick={handleDelete} disabled={loading}>Delete</Button>
            </div>
          )}

          <hr />

          {/* Comments Section */}
          <div className="mt-4">
            <h5>댓글</h5>
            <ListGroup>
              {comments.map((comment) => (
                <ListGroup.Item key={comment.id} className="d-flex justify-content-between align-items-start">
                  <div>
                    <strong>{comment.authorName}</strong>
                    <p className="mb-1">{comment.content}</p>
                    <small className="text-muted">{new Date(comment.createdAt).toLocaleString()}</small>
                  </div>
                  {(user?.id === comment.userId || isAdmin) && (
                    <Button variant="danger" size="sm" onClick={() => handleCommentDelete(comment.id)}>
                      Delete
                    </Button>
                  )}
                </ListGroup.Item>
              ))}
            </ListGroup>

            {/* New Comment Form */}
            {user && (!post.secret || isAuthor || isAdmin) && (
              <Form className="mt-4" onSubmit={handleCommentSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>댓글 작성</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="댓글을 입력하세요."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                </Form.Group>
                <Button variant="primary" type="submit">
                  등록
                </Button>
              </Form>
            )}
          </div>
          
          <Button variant="primary" onClick={() => navigate('/board')} disabled={loading} className="mt-4">
            목록으로
          </Button>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default BoardDetailPage;
