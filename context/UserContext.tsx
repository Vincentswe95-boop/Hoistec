'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  name: string;
  email: string;
  role: string;
  avatar: string;
}

interface UserContextType {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User>>;
  updateAvatar: (avatarUrl: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>({
    name: 'Vincent Bergström',
    email: 'vincent.bergstrom@renta.se',
    role: 'ADMIN',
    avatar: '', 
  });

  // Load saved avatar from localStorage on mount
  useEffect(() => {
    const savedAvatar = localStorage.getItem('user_avatar');
    if (savedAvatar) {
      setUser(prev => ({ ...prev, avatar: savedAvatar }));
    }
  }, []);

  const updateAvatar = (avatarUrl: string) => {
    setUser(prev => {
      const updated = { ...prev, avatar: avatarUrl };
      localStorage.setItem('user_avatar', avatarUrl);
      return updated;
    });
  };

  return (
    <UserContext.Provider value={{ user, setUser, updateAvatar }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    // Safe fallback during SSR/Prerendering to prevent build crashes
    return {
      user: {
        name: 'Vincent Bergström',
        email: 'vincent.bergstrom@renta.se',
        role: 'ADMIN',
        avatar: typeof window !== 'undefined' ? localStorage.getItem('user_avatar') || '' : '',
      },
      setUser: () => {},
      updateAvatar: () => {},
    };
  }
  return context;
}