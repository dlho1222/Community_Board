import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/api';

import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import FormHelperText from '@mui/material/FormHelperText';

const UserProfilePage: React.FC = () => {
    const authContext = useContext(AuthContext);
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

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
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}><CircularProgress /></Box>;
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

        if (password && password !== confirmPassword) {
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
                updatePayload.password = password;
            }

            if (Object.keys(updatePayload).length === 0) {
                setError('No changes detected for update.');
                setLoading(false);
                return;
            }

            const response = await api.put(`/api/users/${user.id}`, updatePayload);
            const updatedUser = response.data;
            login(updatedUser);
            setSuccess('Profile updated successfully!');
            setPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            if (err.response && err.response.data) {
                if (typeof err.response.data === 'string') {
                    setError(err.response.data);
                } else if (err.response.data.message) {
                    setError(err.response.data.message);
                } else if (err.response.data.errors && Array.isArray(err.response.data.errors)) {
                    const validationErrors = err.response.data.errors.map((e: any) => e.defaultMessage || e.message).join(', ');
                    setError(validationErrors || 'Validation error occurred.');
                } else if (err.response.data.error) {
                    setError(err.response.data.error);
                } else {
                    setError('An unknown error occurred on the server.');
                }
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
        <Container component="main" maxWidth="sm" sx={{ mt: 8, mb: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Card sx={{ width: '100%', maxWidth: '30rem' }}>
                <CardContent>
                    <Typography component="h1" variant="h5" align="center" sx={{ mb: 4 }}>
                        User Profile
                    </Typography>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
                    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
                         <TextField
                            margin="normal"
                            fullWidth
                            id="email"
                            label="Email Address"
                            name="email"
                            value={user?.email || ''}
                            disabled
                            InputProps={{
                                readOnly: true,
                            }}
                        />
                        <FormHelperText sx={{ mb: 2 }}>Email cannot be changed.</FormHelperText>

                        <TextField
                            margin="normal"
                            fullWidth
                            id="username"
                            label="Username"
                            name="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />

                        <TextField
                            margin="normal"
                            fullWidth
                            name="password"
                            label="New Password"
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />

                        <TextField
                            margin="normal"
                            fullWidth
                            name="confirmPassword"
                            label="Confirm New Password"
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            error={!!error && error === 'New passwords do not match.'}
                            helperText={error === 'New passwords do not match.' ? error : ''}
                        />

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Update Profile'}
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </Container>
    );
};

export default UserProfilePage;
