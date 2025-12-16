import React, { useState, useContext, useEffect } from 'react';
import { Container, Form, Button, Card, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/api';

const UserProfilePage: React.FC = () => {
    const authContext = useContext(AuthContext);
    const navigate = useNavigate();

    // State for form fields
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState(''); // New state for confirm password

    // State for messages
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!authContext?.isAuthenticated) {
            navigate('/login');
        } else {
            setUsername(authContext.user?.username || '');
        }
    }, [authContext, navigate]);

    if (!authContext) {
        return null;
    }
    const { user, login } = authContext;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        if (!user) {
            setError("You must be logged in to update your profile.");
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) { // Client-side password confirmation
            setError('New passwords do not match.');
            setLoading(false);
            return;
        }

        try {
            const updatePayload: { username?: string; password?: string } = {};

            if (username.trim() !== '' && username !== user?.username) {
                updatePayload.username = username;
            }

            if (password.trim() !== '') {
                if (password !== confirmPassword) { // Client-side password confirmation
                    setError('New passwords do not match.');
                    setLoading(false);
                    return;
                }
                updatePayload.password = password;
            }

            if (Object.keys(updatePayload).length === 0) {
                setError('No changes detected for update.');
                setLoading(false);
                return;
            }

            const response = await api.put(`/api/users/${user.id}`, updatePayload);
            const updatedUser = response.data;
            login(updatedUser); // Update context and localStorage
            setSuccess('Profile updated successfully!');
            setPassword(''); // Clear password field after submission
            setConfirmPassword(''); // Clear confirm password field
        } catch (err: any) {
            if (err.response) {
                setError(err.response.data);
            } else if (err.request) {
                setError('No response from server. Please try again later.');
            } else {
                setError('An unexpected error occurred.');
            }
        } finally {
            setLoading(false);
        }
    };


    return (
        <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
            <Card style={{ width: '30rem' }}>
                <Card.Body>
                    <h2 className="text-center mb-4">User Profile</h2>
                    {error && <Alert variant="danger">{error}</Alert>}
                    {success && <Alert variant="success">{success}</Alert>}
                    <Form onSubmit={handleSubmit}>
                         <Form.Group className="mb-3" controlId="formBasicEmail">
                            <Form.Label>Email address</Form.Label>
                            <Form.Control type="email" value={user?.email || ''} disabled />
                             <Form.Text className="text-muted">
                                 Email cannot be changed.
                             </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="formBasicUsername">
                            <Form.Label>Username</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter new username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                // Removed 'required' attribute
                            />
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="formBasicPassword">
                            <Form.Label>New Password</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="Enter new password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                // Removed 'required' attribute
                            />
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="formBasicConfirmPassword">
                            <Form.Label>Confirm New Password</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                // Removed 'required' attribute
                            />
                        </Form.Group>

                        <Button variant="primary" type="submit" className="w-100" disabled={loading}>
                            {loading ? 'Updating...' : 'Update Profile'}
                        </Button>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default UserProfilePage;
