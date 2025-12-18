import React, { useContext } from 'react';
import { Navbar, Container, Nav, NavDropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Header: React.FC = () => {
    const authContext = useContext(AuthContext);
    const navigate = useNavigate();

    if (!authContext) {
        return null; // or a loading spinner
    }

    const { isAuthenticated, user, logout } = authContext;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <Navbar bg="light" expand="lg">
            <Container>
                <Navbar.Brand as={Link} to="/">Community Board</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        <Nav.Link as={Link} to="/board">Board</Nav.Link>
                    </Nav>
                    <Nav>
                        {isAuthenticated ? (
                            <NavDropdown title={`Welcome, ${user?.username}`} id="basic-nav-dropdown">
                                <NavDropdown.Item as={Link} to="/profile">Profile</NavDropdown.Item>
                                {user?.role === 'ADMIN' && (
                                    <>
                                        <NavDropdown.Divider />
                                        <NavDropdown.Item as={Link} to="/admin/users">Admin User Management</NavDropdown.Item>
                                        <NavDropdown.Item as={Link} to="/admin/posts">Admin Post Management</NavDropdown.Item>
                                    </>
                                )}
                                <NavDropdown.Divider />
                                <NavDropdown.Item onClick={handleLogout}>Logout</NavDropdown.Item>
                            </NavDropdown>
                        ) : (
                            <>
                                <Nav.Link as={Link} to="/login">Login</Nav.Link>
                                <Nav.Link as={Link} to="/register">Register</Nav.Link>
                            </>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default Header;
