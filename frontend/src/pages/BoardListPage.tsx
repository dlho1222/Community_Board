import React, { useState, useEffect, useContext } from 'react';
import { Container, Table, Button, Form, FormControl, InputGroup, Alert, Spinner, Pagination } from 'react-bootstrap';
import postApi from '../api/postApi';
import type { PostResponse, Page } from '../api/postApi'; // Explicitly import type only, if your TypeScript version supports it
import { AuthContext } from '../context/AuthContext'; // Import AuthContext

import { useNavigate } from 'react-router-dom';


const BoardListPage: React.FC = () => {
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>(''); // State for search input
  const [currentPage, setCurrentPage] = useState<number>(0); // 0-indexed page number
  const [pageSize, setPageSize] = useState<number>(10); // Items per page
  const [totalPages, setTotalPages] = useState<number>(0); // Total pages
  const [totalElements, setTotalElements] = useState<number>(0); // Total elements across all pages
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);

  const { user } = authContext || { user: null }; // Default to null if context is not available
  const isAdmin = user?.role === 'ADMIN';

  const fetchPosts = async (keyword?: string, page: number = currentPage, size: number = pageSize) => {
    try {
      setLoading(true);
      setError(null);
      let pageData: Page<PostResponse>;
      if (keyword && keyword.trim() !== '') {
        pageData = await postApi.searchPosts(keyword, user?.id, isAdmin, page, size);
      } else {
        pageData = await postApi.getAllPosts(user?.id, isAdmin, page, size);
      }
      setPosts(pageData.content);
      setTotalPages(pageData.totalPages);
      setCurrentPage(pageData.number); // Update current page based on response
      setTotalElements(pageData.totalElements); // Set total elements
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
    fetchPosts(searchTerm, currentPage, pageSize); // Initial load of all posts
  }, [user, isAdmin, currentPage, pageSize, searchTerm]); // Re-fetch posts if user context or page/size/searchTerm changes

  const handleWritePost = () => {
    navigate('/board/write');
  };

  const handlePostClick = (id: number) => {
    navigate(`/board/${id}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(0); // Reset to first page on new search
    fetchPosts(searchTerm, 0, pageSize);
  };

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
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
              <td>{totalElements - (currentPage * pageSize + index)}</td> {/* Global descending sequential numbering */}
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

export default BoardListPage;
