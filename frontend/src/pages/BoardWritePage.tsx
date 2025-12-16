import React, { useState, useEffect, useContext } from 'react';
import { Container, Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import postApi from '../api/postApi';
import type { PostCreateRequest, PostUpdateRequest, PostResponse } from '../api/postApi'; // Explicitly import types
import { AuthContext } from '../context/AuthContext';

const BoardWritePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = id !== undefined && id !== '';
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [secret, setSecret] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true); // For fetching existing post data

  if (!authContext) {
    // This should ideally not happen if the component is wrapped in AuthProvider
    return <Container className="mt-4"><Alert variant="danger">Authentication context not found.</Alert></Container>;
  }

  const { user } = authContext;

  useEffect(() => {
    if (isEditing && id) {
      const fetchPost = async () => {
        try {
          setInitialLoading(true);
          const post = await postApi.getPostById(parseInt(id));
          setTitle(post.title);
          setContent(post.content);
          setSecret(post.secret);
        } catch (err) {
          console.error('Failed to fetch post for editing:', err);
          setError('Failed to load post for editing.');
        } finally {
          setInitialLoading(false);
        }
      };
      fetchPost();
    } else {
      setInitialLoading(false);
    }
  }, [isEditing, id]);

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
      if (isEditing && id) {
        const updatedPost: PostUpdateRequest = { title, content, secret };
        await postApi.updatePost(parseInt(id), updatedPost);
        navigate(`/board/${id}`);
      } else {
        const newPost: PostCreateRequest = { title, content, userId: user.id, secret };
        const response = await postApi.createPost(newPost);
        navigate(`/board/${response.id}`);
      }
    } catch (err: any) {
      console.error('Failed to save post:', err);
      if (err.response) {
        setError(err.response.data.message || 'Error saving post.');
      } else {
        setError('Error saving post. No response from server.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <Container className="mt-4 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading post data...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <Card>
        <Card.Body>
          <h2 className="text-center mb-4">{isEditing ? '게시글 수정' : '게시글 작성'}</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="postTitle">
              <Form.Label>제목</Form.Label>
              <Form.Control
                type="text"
                placeholder="제목을 입력하세요"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={loading}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="postContent">
              <Form.Label>내용</Form.Label>
              <Form.Control
                as="textarea"
                rows={10}
                placeholder="내용을 입력하세요"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                disabled={loading}
              />
            </Form.Group>

            {/* File upload removed as not yet implemented in backend */}
            {/*
            <Form.Group controlId="formFile" className="mb-3">
              <Form.Label>파일 첨부</Form.Label>
              <Form.Control type="file" multiple />
            </Form.Group>
            */}

            <Form.Group className="mb-3" controlId="formSecret">
              <Form.Check
                type="checkbox"
                label="비밀글"
                checked={secret}
                onChange={(e) => setSecret(e.target.checked)}
                disabled={loading}
              />
            </Form.Group>

            <div className="d-grid gap-2">
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? (isEditing ? '수정 중...' : '작성 중...') : (isEditing ? '수정 완료' : '작성 완료')}
              </Button>
              <Button variant="secondary" onClick={() => navigate(-1)} disabled={loading}>
                취소
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default BoardWritePage;
