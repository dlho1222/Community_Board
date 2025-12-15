import React from 'react';
import { Container, Table, Button } from 'react-bootstrap';

const AdminPostManagementPage: React.FC = () => {
  // Placeholder data for posts
  const posts = [
    { id: 1, title: '첫 번째 게시글', author: 'User1', date: '2025-12-14', views: 10 },
    { id: 2, title: '두 번째 게시글', author: 'User2', date: '2025-12-13', views: 25 },
    { id: 3, title: '세 번째 게시글', author: 'User1', date: '2025-12-12', views: 5 },
  ];

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
            <th>Views</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <tr key={post.id}>
              <td>{post.id}</td>
              <td>{post.title}</td>
              <td>{post.author}</td>
              <td>{post.date}</td>
              <td>{post.views}</td>
              <td>
                <Button variant="info" size="sm" className="me-2">View</Button>
                <Button variant="danger" size="sm">Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
};

export default AdminPostManagementPage;
