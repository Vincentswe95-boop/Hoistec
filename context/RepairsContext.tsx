// context/RepairsContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

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
  addRepair: (repair: Omit<Repair, 'id' | 'repairNo'>) => Promise<void>;
  updateRepair: (id: number, updates: Partial<Repair>) => Promise<void>;
  deleteRepair: (id: number) => Promise<void>;
  getRepairsByHoist: (hoistId: number) => Repair[];
  getAllRepairs: () => Repair[];
}

const RepairsContext = createContext<RepairsContextType | undefined>(undefined);

function generateRepairNo(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);
  return `${year}-${random}`;
}

// Convert database row → our interface
function mapFromDb(row: any): Repair {
  return {
    id: row.id,
    repairNo: row.repair_no,
    hoistId: row.hoist_id,
    date: row.date,
    type: row.type,
    description: row.description || '',
    technician: row.technician || '',
    hours: Number(row.hours) || 0,
    parts: row.parts || '',
    status: row.status,
  };
}

// Convert our interface → database format
function mapToDb(repair: Partial<Repair>) {
  const db: any = {};
  if (repair.repairNo !== undefined) db.repair_no = repair.repairNo;
  if (repair.hoistId !== undefined) db.hoist_id = repair.hoistId;
  if (repair.date !== undefined) db.date = repair.date;
  if (repair.type !== undefined) db.type = repair.type;
  if (repair.description !== undefined) db.description = repair.description;
  if (repair.technician !== undefined) db.technician = repair.technician;
  if (repair.hours !== undefined) db.hours = repair.hours;
  if (repair.parts !== undefined) db.parts = repair.parts;
  if (repair.status !== undefined) db.status = repair.status;
  return db;
}

export function RepairsProvider({ children }: { children: ReactNode }) {
  const [repairs, setRepairs] = useState<Repair[]>([]);

  const fetchRepairs = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      let customerIdToFilter: number | null = null;
      let isCustomer = false;

      if (session?.user?.email) {
        const { data: userRecord } = await supabase
          .from('users')
          .select('role, customer_id')
          .eq('email', session.user.email)
          .single();

        if (userRecord?.role === 'customer' && userRecord?.customer_id) {
          isCustomer = true;
          customerIdToFilter = userRecord.customer_id;
        }
      }

      let query = supabase.from('repairs').select('*');

      if (isCustomer && customerIdToFilter !== null) {
        // Fetch only hoists belonging to this customer
        const { data: customerHoists } = await supabase
          .from('hoists')
          .select('id')
          .eq('customer_id', customerIdToFilter);

        const hoistIds = customerHoists?.map(h => h.id) || [];

        if (hoistIds.length > 0) {
          query = query.in('hoist_id', hoistIds);
        } else {
          setRepairs([]);
          return;
        }
      }

      const { data, error } = await query.order('id', { ascending: false });
      if (error) throw error;
      setRepairs((data || []).map(mapFromDb));
    } catch (err) {
      console.error('Error fetching repairs:', err);
    }
  };

  useEffect(() => {
    fetchRepairs();
  }, []);

  const addRepair = async (newRepair: Omit<Repair, 'id' | 'repairNo'>) => {
    const repairNo = generateRepairNo();
    const { data, error } = await supabase
      .from('repairs')
      .insert([{ ...mapToDb(newRepair), repair_no: repairNo }])
      .select()
      .single();

    if (error) {
      console.error('Error adding repair:', error);
      alert('Failed to add repair');
      return;
    }
    if (data) {
      setRepairs(prev => [mapFromDb(data), ...prev]);
    }
  };

  const updateRepair = async (id: number, updates: Partial<Repair>) => {
    const { error } = await supabase
      .from('repairs')
      .update(mapToDb(updates))
      .eq('id', id);

    if (error) {
      console.error('Error updating repair:', error);
      alert('Failed to update repair');
      return;
    }
    setRepairs(prev => prev.map(r => (r.id === id ? { ...r, ...updates } : r)));
  };

  const deleteRepair = async (id: number) => {
    const { error } = await supabase.from('repairs').delete().eq('id', id);
    if (error) {
      console.error('Error deleting repair:', error);
      alert('Failed to delete repair');
      return;
    }
    setRepairs(prev => prev.filter(r => r.id !== id));
  };

  const getRepairsByHoist = (hoistId: number) => repairs.filter(r => r.hoistId === hoistId);
  const getAllRepairs = () => repairs;

  return (
    <RepairsContext.Provider value={{ repairs, addRepair, updateRepair, deleteRepair, getRepairsByHoist, getAllRepairs }}>
      {children}
    </RepairsContext.Provider>
  );
}

export function useRepairs() {
  const context = useContext(RepairsContext);
  if (!context) throw new Error('useRepairs must be used within RepairsProvider');
  return context;
}