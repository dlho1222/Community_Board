import React, { useState, useEffect, useContext } from 'react';
import { Container, Table, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import adminApi from '../api/adminApi';
import type { PostResponse } from '../api/postApi';

const AdminPostManagementPage: React.FC = () => {
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const authContext = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPosts = async () => {
      if (authContext?.user?.role !== 'ADMIN') {
        setError("Access Denied: You must be an administrator to view this page.");
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const allPosts = await adminApi.getAllPostsForAdmin(authContext.user.id);
        setPosts(allPosts);
      } catch (err) {
        setError('Failed to fetch posts. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (authContext?.user) {
        fetchPosts();
    } else if (!authContext?.isAuthenticated) {
        setLoading(false);
        setError("You must be logged in to view this page.");
    }
  }, [authContext?.user, authContext?.isAuthenticated]);

  const handleDelete = async (postId: number) => {
    if (!authContext?.user || !window.confirm(`Are you sure you want to delete post #${postId}?`)) {
        return;
    }

    try {
        await adminApi.deletePostByAdmin(authContext.user.id, postId);
        // Refresh the list after deletion
        setPosts(posts.filter(post => post.id !== postId));
    } catch (err) {
        alert('Failed to delete post.');
        console.error(err);
    }
  };

  if (loading) {
    return (
      <Container className="mt-4 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
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
      <h2 className="mb-4">Admin: Post Management</h2>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>#</th>
            <th>Title</th>
            <th>Author</th>
            <th>Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <tr key={post.id}>
              <td>{post.id}</td>
              <td>{post.title}</td>
              <td>{post.authorName}</td>
              <td>{new Date(post.createdAt).toLocaleDateString()}</td>
              <td>
                {post.secret && <Badge bg="secondary">Secret</Badge>}
              </td>
              <td>
                <Button variant="info" size="sm" className="me-2" onClick={() => navigate(`/board/${post.id}`)}>View</Button>
                <Button variant="danger" size="sm" onClick={() => handleDelete(post.id)}>Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
};

export default AdminPostManagementPage;
