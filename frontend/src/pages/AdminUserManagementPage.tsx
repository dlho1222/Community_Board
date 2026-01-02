import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import type { User } from '../context/AuthContext';
import adminApi from '../api/adminApi';
import type { AdminUserDetailResponse } from '../api/adminApi';
import { useNavigate, Link as RouterLink } from 'react-router-dom';

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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    List,
    ListItem,
    ListItemText,
    Card,
    CardHeader,
    CardContent,
} from '@mui/material';

const AdminUserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUsername, setNewUsername] = useState('');

  const [showResetModal, setShowResetModal] = useState(false);
  const [resettingUser, setResettingUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedUserDetail, setSelectedUserDetail] = useState<AdminUserDetailResponse | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  
  const authContext = useContext(AuthContext);
  useNavigate(); // Keep useNavigate for consistency, though not directly used here

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
    setNewPassword(''); // Clear password field on opening
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
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography>Loading users...</Typography>
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
    <>
      <Container sx={{ mt: 4 }}>
        <Typography variant="h4" component="h2" gutterBottom>Admin: User Management</Typography>
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="user management table">
            <TableHead>
              <TableRow>
                <TableCell>Id</TableCell>
                <TableCell>Username</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>
                    <Button variant="contained" size="small" sx={{ mr: 1 }} onClick={() => handleViewDetailsClick(user)} disabled={detailsLoading}>View Details</Button>
                    <Button variant="outlined" size="small" sx={{ mr: 1 }} onClick={() => handleEditClick(user)} disabled={detailsLoading}>Edit Username</Button>
                    <Button variant="outlined" size="small" onClick={() => handleResetClick(user)} disabled={detailsLoading}>Edit Password</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>

      {/* Edit User Modal */}
      <Dialog open={showEditModal} onClose={handleEditClose}>
        <DialogTitle>Edit User: {editingUser?.username}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="newUsername"
            label="New Username"
            type="text"
            fullWidth
            variant="standard"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose}>Cancel</Button>
          <Button onClick={handleUpdateUser}>Save Changes</Button>
        </DialogActions>
      </Dialog>

      {/* Reset Password Modal */}
      <Dialog open={showResetModal} onClose={handleResetClose}>
        <DialogTitle>Reset Password for {resettingUser?.username}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="newPassword"
            label="New Password"
            type="password"
            fullWidth
            variant="standard"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleResetClose}>Cancel</Button>
          <Button onClick={handleResetPassword}>Confirm Reset</Button>
        </DialogActions>
      </Dialog>

      {/* User Details Modal */}
      <Dialog open={showDetailsModal} onClose={handleDetailsClose} maxWidth="md" fullWidth>
        <DialogTitle>User Details: {selectedUserDetail?.user.username}</DialogTitle>
        <DialogContent dividers>
            {detailsLoading && <Box sx={{ textAlign: 'center' }}><CircularProgress size="sm" /> <Typography variant="body2">Loading details...</Typography></Box>}
            {detailsError && <Alert severity="error">{detailsError}</Alert>}
            {selectedUserDetail && (
                <Box>
                    <Card sx={{ mb: 3 }}>
                        <CardHeader title="User Information" />
                        <List dense>
                            <ListItem><ListItemText primary={`ID: ${selectedUserDetail.user.id}`} /></ListItem>
                            <ListItem><ListItemText primary={`Username: ${selectedUserDetail.user.username}`} /></ListItem>
                            <ListItem><ListItemText primary={`Email: ${selectedUserDetail.user.email}`} /></ListItem>
                            <ListItem><ListItemText primary={`Role: ${selectedUserDetail.user.role}`} /></ListItem>
                        </List>
                    </Card>

                    <Card sx={{ mb: 3 }}>
                        <CardHeader title={`Posts by ${selectedUserDetail.user.username}`} />
                        <CardContent>
                        {selectedUserDetail.posts.length > 0 ? (
                            <List dense>
                                {selectedUserDetail.posts.map(post => (
                                    <ListItem key={post.id} component={RouterLink} to={`/board/${post.id}`} onClick={handleDetailsClose}>
                                        <ListItemText primary={`${post.title} ${post.secret ? '(비밀글)' : ''}`} />
                                    </ListItem>
                                ))}
                            </List>
                        ) : (
                            <Typography variant="body2">No posts found.</Typography>
                        )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader title={`Comments by ${selectedUserDetail.user.username}`} />
                        <CardContent>
                        {selectedUserDetail.comments.length > 0 ? (
                            <List dense>
                                {selectedUserDetail.comments.map(comment => (
                                    <ListItem key={comment.id} component={RouterLink} to={`/board/${comment.postId}`} onClick={handleDetailsClose}>
                                        <ListItemText
                                            primary={`${comment.content.substring(0, 50)}${comment.content.length > 50 ? '...' : ''}`}
                                            secondary={`(on Post ID: ${comment.postId})`}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        ) : (
                            <Typography variant="body2">No comments found.</Typography>
                        )}
                        </CardContent>
                    </Card>
                </Box>
            )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDetailsClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AdminUserManagementPage;
