import React, { useState, useEffect, useContext } from 'react';
import { Container, Table, Button, Alert, Spinner, Modal, Form, ListGroup, Card } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';
import type { User } from '../context/AuthContext';
import adminApi from '../api/adminApi';
import type { AdminUserDetailResponse } from '../api/adminApi';
import { useNavigate, Link } from 'react-router-dom';

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

  // State for the user details modal
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedUserDetail, setSelectedUserDetail] = useState<AdminUserDetailResponse | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  
  const authContext = useContext(AuthContext);
  useNavigate();
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

  const handleViewDetailsClick = async (user: User) => {
    if (!authContext?.user || authContext.user.role !== 'ADMIN') {
        setDetailsError("Access Denied: You must be an administrator to view user details.");
        return;
    }
    setDetailsLoading(true);
    setDetailsError(null);
    try {
        const details = await adminApi.getAdminUserDetails(authContext.user.id, user.id);
        setSelectedUserDetail(details);
        setShowDetailsModal(true);
    } catch (err) {
        setDetailsError('Failed to fetch user details.');
        console.error(err);
    } finally {
        setDetailsLoading(false);
    }
  };

  const handleDetailsClose = () => {
    setShowDetailsModal(false);
    setSelectedUserDetail(null);
    setDetailsError(null);
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
              <th>Id</th>
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
                  <Button variant="primary" size="sm" className="me-2" onClick={() => handleViewDetailsClick(user)} disabled={detailsLoading}>View Details</Button>
                  <Button variant="info" size="sm" className="me-2" onClick={() => handleEditClick(user)} disabled={detailsLoading}>Edit Username</Button>
                  <Button variant="warning" size="sm" onClick={() => handleResetClick(user)} disabled={detailsLoading}>Edit Password</Button>
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

      {/* User Details Modal */}
      <Modal show={showDetailsModal} onHide={handleDetailsClose} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>User Details: {selectedUserDetail?.user.username}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            {detailsLoading && <div className="text-center"><Spinner animation="border" size="sm" /> Loading details...</div>}
            {detailsError && <Alert variant="danger">{detailsError}</Alert>}
            {selectedUserDetail && (
                <div>
                    <Card className="mb-3">
                        <Card.Header>User Information</Card.Header>
                        <ListGroup variant="flush">
                            <ListGroup.Item>ID: {selectedUserDetail.user.id}</ListGroup.Item>
                            <ListGroup.Item>Username: {selectedUserDetail.user.username}</ListGroup.Item>
                            <ListGroup.Item>Email: {selectedUserDetail.user.email}</ListGroup.Item>
                            <ListGroup.Item>Role: {selectedUserDetail.user.role}</ListGroup.Item>
                        </ListGroup>
                    </Card>

                    <Card className="mb-3">
                        <Card.Header>Posts by {selectedUserDetail.user.username}</Card.Header>
                        {selectedUserDetail.posts.length > 0 ? (
                            <ListGroup variant="flush">
                                {selectedUserDetail.posts.map(post => (
                                    <ListGroup.Item key={post.id}>
                                        <Link to={`/board/${post.id}`} onClick={handleDetailsClose}>
                                            {post.title} {post.secret && '(비밀글)'}
                                        </Link>
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        ) : (
                            <Card.Body>No posts found.</Card.Body>
                        )}
                    </Card>

                    <Card>
                        <Card.Header>Comments by {selectedUserDetail.user.username}</Card.Header>
                        {selectedUserDetail.comments.length > 0 ? (
                            <ListGroup variant="flush">
                                {selectedUserDetail.comments.map(comment => (
                                    <ListGroup.Item key={comment.id}>
                                        <Link to={`/board/${comment.postId}`} onClick={handleDetailsClose}>
                                            {comment.content.substring(0, 50)}...
                                            <small className="text-muted ms-2"> (on Post ID: {comment.postId})</small>
                                        </Link>
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        ) : (
                            <Card.Body>No comments found.</Card.Body>
                        )}
                    </Card>
                </div>
            )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleDetailsClose}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AdminUserManagementPage;
