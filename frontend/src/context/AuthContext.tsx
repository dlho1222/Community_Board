import React, { createContext, useState, useEffect, type ReactNode } from 'react';
import api from '../api/api';

// Define the User type based on our backend User entity
export interface User {
    id: number;
    username: string;
    email: string;
    role: string;
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
        // Check the user's authentication status with the server when the app loads
        const checkAuthStatus = async () => {
            try {
                const response = await api.get<User>('/api/users/me');
                if (response.status === 200 && response.data) {
                    // If the server returns user data, the user is logged in
                    login(response.data);
                }
            } catch (error) {
                // If the request fails (e.g., 401 Unauthorized), the user is not logged in
                setUser(null);
            }
        };

        checkAuthStatus();
    }, []);

    const login = (userData: User) => {
        // Ensure id is a number for consistent type matching
        const userWithNumberId = { ...userData, id: Number(userData.id) };
        setUser(userWithNumberId);
    };

    const logout = () => {
        // Call the backend logout endpoint
        api.post('/api/users/logout').finally(() => {
            // Always clear the user state on the client after attempting to log out
            setUser(null);
        });
    };

    const isAuthenticated = !!user;

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated }}>
            {children}
        </AuthContext.Provider>
    );
};
