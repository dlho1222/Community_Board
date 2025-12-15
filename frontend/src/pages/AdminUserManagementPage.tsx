import React from 'react';
import { Container, Table, Button } from 'react-bootstrap';

const AdminUserManagementPage: React.FC = () => {
  // Placeholder data for users
  const users = [
    { id: 1, username: 'admin', email: 'admin@example.com', role: 'ADMIN' },
    { id: 2, username: 'user1', email: 'user1@example.com', role: 'USER' },
    { id: 3, username: 'user2', email: 'user2@example.com', role: 'USER' },
  ];

  return (
    <Container className="mt-4">
      <h2 className="mb-4">Admin: User Management</h2>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>#</th>
            <th>Username</th>
            <th>Email</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.username}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>
                <Button variant="info" size="sm" className="me-2">Edit</Button>
                <Button variant="danger" size="sm">Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
};

export default AdminUserManagementPage;
