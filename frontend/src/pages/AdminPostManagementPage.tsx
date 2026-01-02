import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import adminApi from '../api/adminApi';
import type { PostResponse, Page } from '../api/postApi'; // Import Page type
import lockIcon from '../assets/lock_icon.png';

// MUI Components
import {
    Container,
    Box,
    Button,
    Alert,
    CircularProgress,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Pagination,
} from '@mui/material';

const AdminPostManagementPage: React.FC = () => {
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState<number>(1); // MUI Pagination is 1-indexed
  const [pageSize] = useState<number>(10); // Items per page
  const [totalPages, setTotalPages] = useState<number>(0); // Total pages
  const [totalElements, setTotalElements] = useState<number>(0); // Total elements across all pages

  const authContext = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPosts = async (page: number = 0, size: number = pageSize) => { // Added page/size params
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
        setCurrentPage(pageData.number + 1); // Adjust for 1-indexed MUI Pagination
        setTotalElements(pageData.totalElements);
      } catch (err) {
        setError('Failed to fetch posts. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (authContext?.user) {
        // Adjust for 0-indexed API calls
        const apiPage = currentPage - 1;
        fetchPosts(apiPage, pageSize); // Call with current page/size
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
        // Adjust for 0-indexed API calls
        const apiPage = currentPage - 1;
        const pageData: Page<PostResponse> = await adminApi.getAllPostsForAdmin(authContext.user.id, apiPage, pageSize);
        setPosts(pageData.content);
        setTotalPages(pageData.totalPages);
        setCurrentPage(pageData.number + 1); // Adjust for 1-indexed MUI Pagination
        setTotalElements(pageData.totalElements);
    } catch (err) {
        alert('Failed to delete post.');
        console.error(err);
    }
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
  };


  if (loading) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography>Loading posts...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }
  
  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" component="h2" gutterBottom>Admin: Post Management</Typography>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="post management table">
          <TableHead>
            <TableRow>
              <TableCell>Seq</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Author</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {posts.map((post, index) => (
              <TableRow
                key={post.id}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  {totalElements - ((currentPage - 1) * pageSize + index)}
                </TableCell>
                <TableCell>
                    <Link to={`/board/${post.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        {post.title}
                    </Link>
                </TableCell>
                <TableCell>{post.authorName}</TableCell>
                <TableCell>{new Date(post.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  {post.secret && <img src={lockIcon} alt="Secret" style={{ width: '20px', height: '20px' }} />}
                </TableCell>
                <TableCell>
                  <Button variant="outlined" color="primary" size="small" sx={{ mr: 1 }} onClick={() => navigate(`/board/${post.id}`)}>View</Button>
                  <Button variant="contained" color="error" size="small" onClick={() => handleDelete(post.id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                showFirstButton
                showLastButton
            />
        </Box>
      )}
    </Container>
  );
};

export default AdminPostManagementPage;
