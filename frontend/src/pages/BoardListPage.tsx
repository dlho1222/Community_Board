import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import postApi from '../api/postApi';
import type { PostResponse, Page } from '../api/postApi';
import { AuthContext } from '../context/AuthContext';
import lockIcon from '../assets/lock_icon.png';

// MUI Components
import {
    Container,
    Box,
    TextField,
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
    InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
};

// Memoized Search Input Component to prevent BoardListPage re-rendering on every keystroke
interface MemoizedSearchInputProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    handleSearchSubmit: (e: React.FormEvent) => void;
    searchInputRef: React.RefObject<HTMLInputElement | null>;
    loading: boolean;
}

const MemoizedSearchInput: React.FC<MemoizedSearchInputProps> = React.memo(({
    searchTerm,
    setSearchTerm,
    handleSearchSubmit,
    searchInputRef,
    loading,
}) => (
    <Box component="form" onSubmit={handleSearchSubmit} sx={{ width: '300px' }}>
        <TextField
            fullWidth
            label="Search posts by title..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
                startAdornment: (
                    <InputAdornment position="start">
                        <SearchIcon />
                    </InputAdornment>
                ),
                endAdornment: (
                    <InputAdornment position="end">
                        <Button onClick={handleSearchSubmit} variant="text" size="small" disabled={loading}>Search</Button>
                    </InputAdornment>
                ),
            }}
            disabled={loading}
            inputRef={searchInputRef}
        />
    </Box>
));

const BoardListPage: React.FC = () => {
    const [posts, setPosts] = useState<PostResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [currentPage, setCurrentPage] = useState<number>(1); // MUI Pagination is 1-indexed
    const [pageSize] = useState<number>(10);
    const [totalPages, setTotalPages] = useState<number>(0);
    const [totalElements, setTotalElements] = useState<number>(0);
    const navigate = useNavigate();
    const authContext = useContext(AuthContext);

    const { user } = authContext || { user: null };
    const isAdmin = user?.role === 'ADMIN';

    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const searchInputRef = useRef<HTMLInputElement>(null);
    // FIX: Move useRef declaration to top-level
    const prevDebouncedSearchTermRef = useRef(''); // Initialize with empty string, will be updated in useEffect

    const fetchPosts = useCallback(async (keyword?: string, page: number = 0, size: number = 10) => {
        try {
            setLoading(true);
            setError(null);
            let pageData: Page<PostResponse>;
            const userId = user?.id;

            if (keyword && keyword.trim() !== '') {
                pageData = await postApi.searchPosts(keyword, userId, isAdmin, page, size);
            } else {
                pageData = await postApi.getAllPosts(userId, isAdmin, page, size);
            }
            setPosts(pageData.content);
            setTotalPages(pageData.totalPages);
            setCurrentPage(pageData.number + 1); // Adjust for 1-indexed MUI Pagination
            setTotalElements(pageData.totalElements);
        } catch (err: any) {
            console.error('Failed to fetch posts:', err);
            setError(err.response?.data?.message || 'Failed to load posts. Please try again later.');
        } finally {
            setLoading(false);
        }
    }, [user?.id, isAdmin]);

    // Effect to reset currentPage to 1 when debouncedSearchTerm changes
    // This ensures new searches start from the first page, but pagination doesn't reset active searches.
    useEffect(() => {
        // Check if `debouncedSearchTerm` has really changed from the previous effective search.
        if (debouncedSearchTerm !== prevDebouncedSearchTermRef.current) {
            if (currentPage !== 1) { // Only reset if not already on the first page
                setCurrentPage(1);
            }
            // Update the ref to track the currently applied debounced search term for the next comparison
            prevDebouncedSearchTermRef.current = debouncedSearchTerm;
        }
    }, [debouncedSearchTerm, currentPage]);


    // Effect to fetch posts when debouncedSearchTerm or currentPage changes
    useEffect(() => {
        const apiPage = currentPage - 1; // Convert 1-indexed UI page to 0-indexed API page
        fetchPosts(debouncedSearchTerm, apiPage, pageSize);
    }, [debouncedSearchTerm, currentPage, pageSize, fetchPosts]);

    useEffect(() => {
        if (!loading && searchInputRef.current && document.activeElement !== searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [loading]);

    const handleWritePost = () => {
        navigate('/board/write');
    };
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // When submitting directly, the debouncedSearchTerm might not have caught up yet.
        // So, explicitly trigger a fetch with the current searchTerm and reset page.
        setCurrentPage(1); // Reset to first page (1-indexed)
        fetchPosts(searchTerm, 0, pageSize); // API is 0-indexed
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
            <Typography variant="h4" component="h2" gutterBottom>Community Board</Typography>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <MemoizedSearchInput
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    handleSearchSubmit={handleSearchSubmit}
                    searchInputRef={searchInputRef}
                    loading={loading}
                />
                <Button variant="contained" onClick={handleWritePost}>Write Post</Button>
            </Box>

            <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="simple table">
                    <TableHead>
                        <TableRow>
                            <TableCell>Seq</TableCell>
                            <TableCell>Title</TableCell>
                            <TableCell>Author</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell>Secret</TableCell>
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

export default BoardListPage;
