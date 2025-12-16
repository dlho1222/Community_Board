import React, { useState, useEffect, useContext } from 'react';
import { Container, Card, Button, Alert, Spinner } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import postApi from '../api/postApi';
import type { PostResponse } from '../api/postApi'; // Explicitly import type only
import { AuthContext } from '../context/AuthContext'; // Import AuthContext

const BoardDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);

  const [post, setPost] = useState<PostResponse | null>(null);
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
    const fetchPost = async () => {
      if (!id) {
        setError('Post ID is missing.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await postApi.getPostById(parseInt(id));
        setPost(data);
      } catch (err: any) {
        console.error('Failed to fetch post:', err);
        if (err.response && err.response.data && err.response.data.message) {
            setError(err.response.data.message);
        } else if (err.response && err.response.data) {
            setError(err.response.data);
        }
        else {
            setError('Failed to load post. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
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

          {/* Comments and File Attachments are separate features, removed for now */}
          <Alert variant="info">댓글 및 파일 첨부 기능은 아직 구현되지 않았습니다.</Alert>
          
          <Button variant="primary" onClick={() => navigate('/board')} disabled={loading}>
            목록으로
          </Button>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default BoardDetailPage;
