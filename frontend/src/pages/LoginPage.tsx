import React, { useState, useContext } from 'react';
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

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const authContext = useContext(AuthContext);

    if (!authContext) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}><CircularProgress /></Box>;
    }

    const { login } = authContext;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await api.post('/api/users/login', { email, password });
            const userData = response.data;
            login(userData); // Update auth context
            navigate('/'); // Redirect to homepage
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
        <Container component="main" maxWidth="xs" sx={{ mt: 8, mb: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Card sx={{ width: '100%', maxWidth: '25rem' }}>
                <CardContent>
                    <Typography component="h1" variant="h5" align="center" sx={{ mb: 4 }}>
                        Login
                    </Typography>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="email"
                            label="Email Address"
                            name="email"
                            autoComplete="email"
                            autoFocus
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Password"
                            type="password"
                            id="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Login'}
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </Container>
    );
};

export default LoginPage;
