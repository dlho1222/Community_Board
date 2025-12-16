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
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
                console.log('AuthContext: User loaded from localStorage:', parsedUser);
                console.log('AuthContext: User ID from localStorage:', parsedUser.id, 'Type:', typeof parsedUser.id);
            } catch (e) {
                console.error('AuthContext: Failed to parse user from localStorage', e);
                localStorage.removeItem('user');
            }
        }
    }, []);

    const login = (userData: User) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        console.log('AuthContext: User data set by login function:', userData);
        console.log('AuthContext: User ID set by login function:', userData.id, 'Type:', typeof userData.id);
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
