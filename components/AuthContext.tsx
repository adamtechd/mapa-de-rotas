import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User } from '../types';

// Mock user database
const MOCK_USERS: { [key: string]: User } = {
  admin: { name: 'Admin User', role: 'admin' },
  gold: { name: 'Viewer User', role: 'viewer' },
};

interface AuthContextType {
  user: User | null;
  login: (username: string, pass: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for a logged-in user in session storage on initial load
    try {
      const storedUser = sessionStorage.getItem('authUser');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from session storage", error);
      sessionStorage.removeItem('authUser');
    }
  }, []);

  const login = async (username: string, pass: string): Promise<void> => {
    // In a real app, this would be a fetch call to a backend API
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const foundUser = MOCK_USERS[username.toLowerCase()];
        // Mock password check (in a real app, never do this client-side)
        if (foundUser && pass === username.toLowerCase()) {
          setUser(foundUser);
          sessionStorage.setItem('authUser', JSON.stringify(foundUser));
          resolve();
        } else {
          reject(new Error('Credenciais inválidas. Tente "admin/admin" ou "gold/gold".'));
        }
      }, 500);
    });
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('authUser');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};