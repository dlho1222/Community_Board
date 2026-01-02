import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import { Container } from '@mui/material'; // MUI Container

const Header: React.FC = () => {
    const authContext = useContext(AuthContext);
    const navigate = useNavigate();
    const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
    const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null);

    if (!authContext) {
        return null; // or a loading spinner
    }

    const { isAuthenticated, user, logout } = authContext;

    const handleLogout = () => {
        logout();
        navigate('/login');
        handleCloseUserMenu();
    };

    const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorElUser(event.currentTarget);
    };

    const handleCloseUserMenu = () => {
        setAnchorElUser(null);
    };

    const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorElNav(event.currentTarget);
    };

    const handleCloseNavMenu = () => {
        setAnchorElNav(null);
    };

    return (
        <AppBar position="static">
            <Container maxWidth="xl">
                <Toolbar disableGutters>
                    {/* Large screen brand */}
                    <Typography
                        variant="h6"
                        noWrap
                        component={Link}
                        to="/"
                        sx={{
                            mr: 2,
                            display: { xs: 'none', md: 'flex' },
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            letterSpacing: '.1rem',
                            color: 'inherit',
                            textDecoration: 'none',
                        }}
                    >
                        Community Board
                    </Typography>

                    {/* Small screen navigation menu */}
                    <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
                        <IconButton
                            size="large"
                            aria-label="account of current user"
                            aria-controls="menu-appbar"
                            aria-haspopup="true"
                            onClick={handleOpenNavMenu}
                            color="inherit"
                        >
                            <MenuIcon />
                        </IconButton>
                        <Menu
                            id="menu-appbar"
                            anchorEl={anchorElNav}
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'left',
                            }}
                            keepMounted
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'left',
                            }}
                            open={Boolean(anchorElNav)}
                            onClose={handleCloseNavMenu}
                            sx={{
                                display: { xs: 'block', md: 'none' },
                            }}
                        >
                            <MenuItem onClick={handleCloseNavMenu} component={Link} to="/board">
                                <Typography textAlign="center">Board</Typography>
                            </MenuItem>
                            {!isAuthenticated ? (
                                [
                                    <MenuItem key="login" onClick={handleCloseNavMenu} component={Link} to="/login">
                                        <Typography textAlign="center">Login</Typography>
                                    </MenuItem>,
                                    <MenuItem key="register" onClick={handleCloseNavMenu} component={Link} to="/register">
                                        <Typography textAlign="center">Register</Typography>
                                    </MenuItem>,
                                ]
                            ) : null}
                        </Menu>
                    </Box>

                    {/* Small screen brand */}
                    <Typography
                        variant="h5"
                        noWrap
                        component={Link}
                        to="/"
                        sx={{
                            mr: 2,
                            display: { xs: 'flex', md: 'none' },
                            flexGrow: 1,
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            letterSpacing: '.1rem',
                            color: 'inherit',
                            textDecoration: 'none',
                        }}
                    >
                        Community Board
                    </Typography>

                    {/* Large screen navigation */}
                    <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
                        <Button
                            onClick={handleCloseNavMenu}
                            component={Link}
                            to="/board"
                            sx={{ my: 2, color: 'white', display: 'block' }}
                        >
                            Board
                        </Button>
                    </Box>

                    <Box sx={{ flexGrow: 0 }}>
                        {isAuthenticated ? (
                            <>
                                <Button onClick={handleOpenUserMenu} sx={{ p: 0, color: 'white' }}>
                                    Welcome, {user?.username}
                                </Button>
                                <Menu
                                    sx={{ mt: '45px' }}
                                    id="menu-appbar-user"
                                    anchorEl={anchorElUser}
                                    anchorOrigin={{
                                        vertical: 'top',
                                        horizontal: 'right',
                                    }}
                                    keepMounted
                                    transformOrigin={{
                                        vertical: 'top',
                                        horizontal: 'right',
                                    }}
                                    open={Boolean(anchorElUser)}
                                    onClose={handleCloseUserMenu}
                                >
                                    <MenuItem onClick={handleCloseUserMenu} component={Link} to="/profile">
                                        <Typography textAlign="center">Profile</Typography>
                                    </MenuItem>
                                    {user?.role === 'ADMIN' && (
                                        <>
                                            <MenuItem onClick={handleCloseUserMenu} component={Link} to="/admin/users">
                                                <Typography textAlign="center">Admin User Management</Typography>
                                            </MenuItem>
                                            <MenuItem onClick={handleCloseUserMenu} component={Link} to="/admin/posts">
                                                <Typography textAlign="center">Admin Post Management</Typography>
                                            </MenuItem>
                                        </>
                                    )}
                                    <MenuItem onClick={handleLogout}>
                                        <Typography textAlign="center">Logout</Typography>
                                    </MenuItem>
                                </Menu>
                            </>
                        ) : (
                            <Box sx={{ display: 'flex' }}>
                                <Button color="inherit" component={Link} to="/login">Login</Button>
                                <Button color="inherit" component={Link} to="/register">Register</Button>
                            </Box>
                        )}
                    </Box>
                </Toolbar>
            </Container>
        </AppBar>
    );
};

export default Header;
