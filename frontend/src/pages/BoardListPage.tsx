import React, { useState, useEffect, useContext } from 'react';
import { Container, Table, Button, Form, FormControl, InputGroup, Alert, Spinner } from 'react-bootstrap';
import postApi from '../api/postApi';
import type { PostResponse } from '../api/postApi'; // Explicitly import type only, if your TypeScript version supports it
import { AuthContext } from '../context/AuthContext'; // Import AuthContext

import { useNavigate } from 'react-router-dom';


const BoardListPage: React.FC = () => {
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>(''); // State for search input
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);

  const { user } = authContext || { user: null }; // Default to null if context is not available
  const isAdmin = user?.role === 'ADMIN';

  const fetchPosts = async (keyword?: string) => {
    try {
      setLoading(true);
      setError(null);
      let data: PostResponse[];
      if (keyword && keyword.trim() !== '') {
        data = await postApi.searchPosts(keyword, user?.id, isAdmin);
      } else {
        data = await postApi.getAllPosts(user?.id, isAdmin);
      }
      setPosts(data);
    } catch (err: any) {
      console.error('Failed to fetch posts:', err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to load posts. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(); // Initial load of all posts
  }, [user, isAdmin]); // Re-fetch posts if user context changes

  const handleWritePost = () => {
    navigate('/board/write');
  };

  const handlePostClick = (id: number) => {
    navigate(`/board/${id}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPosts(searchTerm);
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
        <Form onSubmit={handleSearch}>
            <InputGroup style={{ width: '300px' }}>
              <FormControl
                placeholder="Search posts by title..."
                aria-label="Search posts"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button variant="outline-secondary" type="submit">Search</Button>
            </InputGroup>
        </Form>
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
