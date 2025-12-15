import React from 'react';
import { Container, Table, Button, Form, FormControl, InputGroup } from 'react-bootstrap';

const BoardListPage: React.FC = () => {
  // Placeholder data
  const posts = [
    { id: 1, title: '첫 번째 게시글', author: 'User1', date: '2025-12-14', views: 10 },
    { id: 2, title: '두 번째 게시글', author: 'User2', date: '2025-12-13', views: 25 },
    { id: 3, title: '세 번째 게시글', author: 'User1', date: '2025-12-12', views: 5 },
  ];

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
        <Button variant="primary" href="/board/write">Write Post</Button>
      </div>

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>#</th>
            <th>Title</th>
            <th>Author</th>
            <th>Date</th>
            <th>Views</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <tr key={post.id}>
              <td>{post.id}</td>
              <td><a href={`/board/${post.id}`}>{post.title}</a></td>
              <td>{post.author}</td>
              <td>{post.date}</td>
              <td>{post.views}</td>
            </tr>
          ))}
        </tbody>
      </Table>
      {/* Pagination will go here */}
    </Container>
  );
};

export default BoardListPage;
