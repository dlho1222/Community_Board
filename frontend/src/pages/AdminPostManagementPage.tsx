import React, { useState, useEffect, useContext } from 'react';
import { Container, Table, Button, Alert, Spinner, Badge, Pagination } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import adminApi from '../api/adminApi';
import type { PostResponse, Page } from '../api/postApi'; // Import Page type

const AdminPostManagementPage: React.FC = () => {
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState<number>(0); // 0-indexed page number
  const [pageSize] = useState<number>(10); // Items per page
  const [totalPages, setTotalPages] = useState<number>(0); // Total pages
  const [totalElements, setTotalElements] = useState<number>(0); // Total elements across all pages

  const authContext = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPosts = async (page: number = currentPage, size: number = pageSize) => { // Added page/size params
      if (authContext?.user?.role !== 'ADMIN') {
        setError("Access Denied: You must be an administrator to view this page.");
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const pageData: Page<PostResponse> = await adminApi.getAllPostsForAdmin(authContext.user.id, page, size); // Pass page/size
        setPosts(pageData.content);
        setTotalPages(pageData.totalPages);
        setCurrentPage(pageData.number);
        setTotalElements(pageData.totalElements);
      } catch (err) {
        setError('Failed to fetch posts. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (authContext?.user) {
        fetchPosts(currentPage, pageSize); // Call with current page/size
    } else if (!authContext?.isAuthenticated) {
        setLoading(false);
        setError("You must be logged in to view this page.");
    }
  }, [authContext?.user, authContext?.isAuthenticated, currentPage, pageSize]); // Add currentPage/pageSize to dependencies

  const handleDelete = async (postId: number) => {
    if (!authContext?.user || !window.confirm(`Are you sure you want to delete post #${postId}?`)) {
        return;
    }

    try {
        await adminApi.deletePostByAdmin(authContext.user.id, postId);
        // Refresh the list after deletion by re-fetching
        // To ensure correct pagination, re-fetch the current page or adjust state carefully
        // For simplicity, re-fetch the current page.
        const pageData: Page<PostResponse> = await adminApi.getAllPostsForAdmin(authContext.user.id, currentPage, pageSize);
        setPosts(pageData.content);
        setTotalPages(pageData.totalPages);
        setCurrentPage(pageData.number);
        setTotalElements(pageData.totalElements);
    } catch (err) {
        alert('Failed to delete post.');
        console.error(err);
    }
  };

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
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
            <th>Seq</th>
            <th>Title</th>
            <th>Author</th>
            <th>Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post, index) => ( // Added index for numbering
            <tr key={post.id}>
              <td>{totalElements - (currentPage * pageSize + index)}</td> {/* Global descending sequential numbering */}
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

      {totalPages > 1 && (
        <Pagination className="justify-content-center mt-4">
          <Pagination.Prev onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 0} />
          {[...Array(totalPages)].map((_, i) => (
            <Pagination.Item key={i} active={i === currentPage} onClick={() => handlePageChange(i)}>
              {i + 1}
            </Pagination.Item>
          ))}
          <Pagination.Next onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages - 1} />
        </Pagination>
      )}
    </Container>
  );
};

export default AdminPostManagementPage;
