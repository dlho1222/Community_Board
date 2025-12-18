import React, { useState, useEffect, useContext } from 'react';
import { Container, Table, Button, Alert, Spinner, Modal, Form } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';
import type { User } from '../context/AuthContext';
import adminApi from '../api/adminApi';

const AdminUserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for the edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUsername, setNewUsername] = useState('');

  // State for the password reset modal
  const [showResetModal, setShowResetModal] = useState(false);
  const [resettingUser, setResettingUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  
  const authContext = useContext(AuthContext);

  useEffect(() => {
    const fetchUsers = async () => {
      if (authContext?.user?.role !== 'ADMIN') {
        setError("Access Denied: You must be an administrator to view this page.");
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const allUsers = await adminApi.getAllUsers(authContext.user.id);
        setUsers(allUsers);
      } catch (err) {
        setError('Failed to fetch users. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (authContext?.user) {
        fetchUsers();
    } else if (!authContext?.isAuthenticated) {
        setLoading(false);
        setError("You must be logged in to view this page.");
    }
  }, [authContext?.user, authContext?.isAuthenticated]);

  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setNewUsername(user.username);
    setShowEditModal(true);
  };

  const handleEditClose = () => {
    setShowEditModal(false);
    setEditingUser(null);
    setNewUsername('');
  };

  const handleUpdateUser = async () => {
    if (!editingUser || !newUsername.trim() || !authContext?.user) {
      alert('New username cannot be empty.');
      return;
    }
    
    if (newUsername.trim() === editingUser.username) {
        handleEditClose();
        return;
    }

    try {
      const updatedUser = await adminApi.updateUserByAdmin(
        authContext.user.id,
        editingUser.id,
        { username: newUsername.trim() }
      );
      setUsers(users.map(user => user.id === updatedUser.id ? updatedUser : user));
      handleEditClose();
    } catch (err: any) {
      const errorMessage = err.response?.data || 'Failed to update user.';
      alert(`Error: ${errorMessage}`);
    }
  };

  const handleResetClick = (user: User) => {
    setResettingUser(user);
    setShowResetModal(true);
  };

  const handleResetClose = () => {
    setShowResetModal(false);
    setResettingUser(null);
    setNewPassword('');
  };

  const handleResetPassword = async () => {
    if (!resettingUser || !newPassword.trim() || !authContext?.user) {
      alert('New password cannot be empty.');
      return;
    }

    try {
      const message = await adminApi.resetPasswordByAdmin(
        authContext.user.id,
        resettingUser.id,
        newPassword.trim()
      );
      alert(message);
      handleResetClose();
    } catch (err: any) {
      const errorMessage = err.response?.data || 'Failed to reset password.';
      alert(`Error: ${errorMessage}`);
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
    <>
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
                  <Button variant="info" size="sm" className="me-2" onClick={() => handleEditClick(user)}>Edit Username</Button>
                  <Button variant="warning" size="sm" onClick={() => handleResetClick(user)}>Reset Password</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Container>

      {/* Edit User Modal */}
      <Modal show={showEditModal} onHide={handleEditClose}>
        <Modal.Header closeButton>
          <Modal.Title>Edit User: {editingUser?.username}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>New Username</Form.Label>
              <Form.Control
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                autoFocus
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleEditClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleUpdateUser}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Reset Password Modal */}
      <Modal show={showResetModal} onHide={handleResetClose}>
        <Modal.Header closeButton>
          <Modal.Title>Reset Password for {resettingUser?.username}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>New Password</Form.Label>
              <Form.Control
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoFocus
                placeholder="Enter new password"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleResetClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleResetPassword}>
            Confirm Reset
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AdminUserManagementPage;
