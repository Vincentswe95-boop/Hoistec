// app/context/UserContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id?: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  [key: string]: any;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  updateAvatar: (avatarUrl: string) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('renta_user');
      const savedAvatar = localStorage.getItem('user_avatar');

      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser({
          ...parsedUser,
          avatar: savedAvatar || parsedUser.avatar || '',
        });
      }
    } catch (err) {
      console.error('Failed to load user from localStorage:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateAvatar = (avatarUrl: string) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, avatar: avatarUrl };
      localStorage.setItem('user_avatar', avatarUrl);
      return updated;
    });
  };

  const logout = () => {
    localStorage.removeItem('renta_user');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <UserContext.Provider value={{ user, loading, setUser, updateAvatar, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    // Fallback during SSR or prerendering to prevent crashes
    return {
      user: null,
      loading: true,
      setUser: () => {},
      updateAvatar: () => {},
      logout: () => {},
    };
  }
  return context;
}
