import React, { createContext, useState, useEffect, ReactNode } from 'react';
import api from '../api/api';

// Define the User type based on our backend User entity
interface User {
    id: number;
    username: string;
    email: string;
    // Do not include password here for security
}

interface AuthContextType {
    user: User | null;
    login: (userData: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        // Check localStorage for a logged-in user when the app loads
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const login = (userData: User) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const logout = () => {
        // Call the backend logout endpoint (optional, good practice)
        api.post('/api/users/logout').catch(error => {
            console.error("Logout failed", error);
        });
        setUser(null);
        localStorage.removeItem('user');
    };

    const isAuthenticated = !!user;

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated }}>
            {children}
        </AuthContext.Provider>
    );
};
