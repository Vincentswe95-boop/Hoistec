'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type RepairType = 'Service' | 'Repair' | 'Inspection' | 'Transport';

export interface Repair {
  id: number;
  repairNo: string;
  hoistId: number;
  date: string;
  type: RepairType;
  description: string;
  technician: string;
  hours: number;
  parts: string;
  status: 'Scheduled' | 'In Progress' | 'Completed';
}

interface RepairsContextType {
  repairs: Repair[];
  addRepair: (repair: Omit<Repair, 'id' | 'repairNo'>) => void;
  updateRepair: (id: number, updatedFields: Partial<Repair>) => void;
  deleteRepair: (id: number) => void;
  getRepairsByHoist: (hoistId: number) => Repair[];
  getAllRepairs: () => Repair[];
}

const RepairsContext = createContext<RepairsContextType | undefined>(undefined);

function generateRepairNo(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function RepairsProvider({ children }: { children: ReactNode }) {
  const [repairs, setRepairs] = useState<Repair[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('repairs');
    if (saved) setRepairs(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('repairs', JSON.stringify(repairs));
  }, [repairs]);

  const addRepair = (newRepair: Omit<Repair, 'id' | 'repairNo'>) => {
    const id = Math.max(0, ...repairs.map(r => r.id), 0) + 1;
    const repairNo = generateRepairNo();
    setRepairs([...repairs, { ...newRepair, id, repairNo }]);
  };

  const updateRepair = (id: number, updatedFields: Partial<Repair>) => {
    setRepairs(repairs.map(r => r.id === id ? { ...r, ...updatedFields } : r));
  };

  const deleteRepair = (id: number) => {
    setRepairs(repairs.filter(r => r.id !== id));
  };

  const getRepairsByHoist = (hoistId: number) =>
    repairs.filter(r => r.hoistId === hoistId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getAllRepairs = () =>
    [...repairs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <RepairsContext.Provider value={{ repairs, addRepair, updateRepair, deleteRepair, getRepairsByHoist, getAllRepairs }}>
      {children}
    </RepairsContext.Provider>
  );
}

export const useRepairs = () => {
  const context = useContext(RepairsContext);
  if (!context) throw new Error('useRepairs must be used within a RepairsProvider');
  return context;
};