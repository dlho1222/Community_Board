import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Container, Form, Button, Card, Alert, Spinner, ListGroup } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import postApi from '../api/postApi';
import type { PostCreateRequest, PostUpdateRequest } from '../api/postApi';
import { AuthContext } from '../context/AuthContext';
import { fileApi } from '../api/fileApi';
import type { FileResponse } from '../api/fileApi';

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
    return <Container className="mt-4"><Alert variant="danger">Authentication context not found.</Alert></Container>;
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
        await postApi.updatePost(parseInt(id), updatedPost, user?.id, isAdmin); // Pass currentUserId and isAdmin
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

            {isEditing && existingFiles.length > 0 && (
              <Form.Group className="mb-3">
                <Form.Label>첨부된 파일</Form.Label>
                <ListGroup>
                  {existingFiles.map((file) => (
                    <ListGroup.Item key={file.id} className="d-flex justify-content-between align-items-center">
                      <span>{file.fileName} ({formatFileSize(file.fileSize)})</span>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteExistingFile(file.id)}
                        disabled={loading}
                      >
                        삭제
                      </Button>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Form.Group>
            )}

            <Form.Group controlId="formFile" className="mb-3">
              <Form.Label>파일 추가</Form.Label>
              <Form.Control type="file" multiple onChange={handleFileChange} disabled={loading} />
            </Form.Group>

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
