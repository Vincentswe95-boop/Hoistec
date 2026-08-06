'use client';

import React, { createContext, useContext, useState } from 'react';

interface User {
  name: string;
  email: string;
  role: string;
  avatar: string;
}

interface UserContextType {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User>>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>({
    name: 'Vincent Bergström',
    email: 'vincent.bergstrom@renta.se',
    role: 'ADMIN',
    avatar: '', 
  });

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    return {
      user: {
        name: 'Vincent Bergström',
        email: 'vincent.bergstrom@renta.se',
        role: 'ADMIN',
        avatar: '',
      },
      setUser: () => {},
    };
  }
  return context;
}
