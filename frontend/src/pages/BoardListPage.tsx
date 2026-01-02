import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { Container, Table, Button, Form, FormControl, InputGroup, Alert, Spinner, Pagination } from 'react-bootstrap';
import postApi from '../api/postApi';
import type { PostResponse, Page } from '../api/postApi';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

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

const BoardListPage: React.FC = () => {
    const [posts, setPosts] = useState<PostResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [currentPage, setCurrentPage] = useState<number>(0);
    const [pageSize] = useState<number>(10);
    const [totalPages, setTotalPages] = useState<number>(0);
    const [totalElements, setTotalElements] = useState<number>(0);
    const navigate = useNavigate();
    const authContext = useContext(AuthContext);

    const { user } = authContext || { user: null };
    const isAdmin = user?.role === 'ADMIN';

    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const searchInputRef = useRef<HTMLInputElement>(null); // 검색 입력 필드용 ref 생성

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
            setCurrentPage(pageData.number);
            setTotalElements(pageData.totalElements);
        } catch (err: any) {
            console.error('Failed to fetch posts:', err);
            setError(err.response?.data?.message || 'Failed to load posts. Please try again later.');
        } finally {
            setLoading(false);
        }
    }, [user?.id, isAdmin]);

    useEffect(() => {
        if (debouncedSearchTerm) {
            setCurrentPage(0);
        }
        fetchPosts(debouncedSearchTerm, currentPage, pageSize);
    }, [debouncedSearchTerm, currentPage, pageSize, fetchPosts]);

    // 로딩이 완료된 후 검색 입력 필드에 포커스를 다시 설정
    useEffect(() => {
        if (!loading && searchInputRef.current && document.activeElement !== searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [loading]);

    const handleWritePost = () => {
        navigate('/board/write');
    };

    const handlePostClick = (id: number) => {
        navigate(`/board/${id}`);
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(0);
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
                <Form onSubmit={handleSearchSubmit}>
                    <InputGroup style={{ width: '300px' }}>
                        <FormControl
                            ref={searchInputRef} // ref 연결
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
                    <th>Seq</th>
                    <th>Title</th>
                    <th>Author</th>
                    <th>Date</th>
                    <th>Secret</th>
                </tr>
                </thead>
                <tbody>
                {posts.map((post, index) => (
                    <tr key={post.id}>
                        <td>{totalElements - (currentPage * pageSize + index)}</td>
                        <td>
                            <a href="#" onClick={(e) => { e.preventDefault(); handlePostClick(post.id); }}>
                                {post.title}
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
