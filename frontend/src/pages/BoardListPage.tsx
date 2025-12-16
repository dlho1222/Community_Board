import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Form, FormControl, InputGroup, Alert, Spinner } from 'react-bootstrap';
import postApi from '../api/postApi';
import type { PostResponse } from '../api/postApi'; // Explicitly import type only, if your TypeScript version supports it
// If the above line still fails, you might need to manually define the interface here or change import style

import { useNavigate } from 'react-router-dom';


const BoardListPage: React.FC = () => {
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const data = await postApi.getAllPosts();
        setPosts(data);
      } catch (err) {
        console.error('Failed to fetch posts:', err);
        setError('Failed to load posts. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const handleWritePost = () => {
    navigate('/board/write');
  };

  const handlePostClick = (id: number) => {
    navigate(`/board/${id}`);
  };

  if (loading) {
    return (
      <Container className="mt-4 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading posts...</span>
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

  return (
    <Container className="mt-4">
      <h2 className="mb-4">Community Board</h2>

      <div className="d-flex justify-content-between mb-3">
        <InputGroup style={{ width: '300px' }}>
          <FormControl
            placeholder="Search posts..."
            aria-label="Search posts"
          />
          <Button variant="outline-secondary">Search</Button>
        </InputGroup>
        <Button variant="primary" onClick={handleWritePost}>Write Post</Button>
      </div>

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>#</th>
            <th>Title</th>
            <th>Author</th>
            <th>Date</th>
            <th>Secret</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post, index) => (
            <tr key={post.id}>
              <td>{posts.length - index}</td>
              <td><a href="#" onClick={(e) => { e.preventDefault(); handlePostClick(post.id); }}>
                {post.secret ? '비밀글입니다.' : post.title}
                </a>
              </td>
              <td>{post.authorName}</td>
              <td>{new Date(post.createdAt).toLocaleDateString()}</td>
              <td>{post.secret ? 'Yes' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </Table>
      {/* Pagination will go here */}
    </Container>
  );
};

export default BoardListPage;
