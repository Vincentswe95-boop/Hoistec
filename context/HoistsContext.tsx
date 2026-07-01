'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Hoist {
  id: number;
  serialNumber: string;
  individualNumber?: string;
  model: string;
  manufacturer: string;
  status: 'On Site' | 'Off Site' | 'Assembling' | 'Disassembling' | 'Stopped' | 'Fault';
  currentSite: string;
  location?: { lat: number; lng: number };
  windSpeedLimit?: number;
  customerId?: number | null;   // ← NEW FIELD
}

interface HoistsContextType {
  hoists: Hoist[];
  addHoist: (hoist: Omit<Hoist, 'id'>) => void;
  updateHoist: (id: number, updates: Partial<Hoist>) => void;
  deleteHoist: (id: number) => void;
  getHoistById: (id: number) => Hoist | undefined;
  getHoistsByCustomer: (customerId: number) => Hoist[];   // ← NEW HELPER
}

const HoistsContext = createContext<HoistsContextType | undefined>(undefined);

export function HoistsProvider({ children }: { children: ReactNode }) {
  const [hoists, setHoists] = useState<Hoist[]>([]);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('hoistec_hoists');
    if (saved) {
      setHoists(JSON.parse(saved));
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('hoistec_hoists', JSON.stringify(hoists));
  }, [hoists]);

  const addHoist = (newHoist: Omit<Hoist, 'id'>) => {
    const id = Math.max(0, ...hoists.map(h => h.id), 0) + 1;
    setHoists([...hoists, { ...newHoist, id, customerId: newHoist.customerId ?? null }]);
  };

  const updateHoist = (id: number, updates: Partial<Hoist>) => {
    setHoists(prev =>
      prev.map(hoist =>
        hoist.id === id ? { ...hoist, ...updates } : hoist
      )
    );
  };

  const deleteHoist = (id: number) => {
    setHoists(prev => prev.filter(hoist => hoist.id !== id));
  };

  const getHoistById = (id: number) => {
    return hoists.find(h => h.id === id);
  };

  // NEW: Get all hoists belonging to one customer
  const getHoistsByCustomer = (customerId: number) => {
    return hoists.filter(h => h.customerId === customerId);
  };

  return (
    <HoistsContext.Provider
      value={{
        hoists,
        addHoist,
        updateHoist,
        deleteHoist,
        getHoistById,
        getHoistsByCustomer,
      }}
    >
      {children}
    </HoistsContext.Provider>
  );
}

export function useHoists() {
  const context = useContext(HoistsContext);
  if (context === undefined) {
    throw new Error('useHoists must be used within a HoistsProvider');
  }
  return context;
}