import React, { useState, useEffect, useContext } from 'react';
import { Container, Card, Button, Alert, Spinner, ListGroup, Form } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import postApi from '../api/postApi';
import type { PostResponse } from '../api/postApi'; // Explicitly import type only
import commentApi from '../api/commentApi';
import type { CommentResponse } from '../api/commentApi';
import { AuthContext } from '../context/AuthContext'; // Import AuthContext

const BoardDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);

  const [post, setPost] = useState<PostResponse | null>(null);
  const [comments, setComments] = useState<CommentResponse[]>([]);
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

  useEffect(() => {
    const fetchPostAndComments = async () => {
      if (!id) {
        setError('Post ID is missing.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const postData = await postApi.getPostById(parseInt(id));
        setPost(postData);
        const commentsData = await commentApi.getCommentsByPostId(parseInt(id));
        setComments(commentsData);
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
    };

    fetchPostAndComments();
  }, [id]);

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

          {/* Edit and Delete buttons */}
          {(isAuthor || isAdmin) && (
            <div className="d-flex justify-content-end mb-3">
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
          
          <Button variant="primary" onClick={() => navigate('/board')} disabled={loading}>
            목록으로
          </Button>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default BoardDetailPage;
