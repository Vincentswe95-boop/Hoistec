// context/HoistsContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

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
  customerId?: number | null;
}

interface HoistsContextType {
  hoists: Hoist[];
  addHoist: (hoist: Omit<Hoist, 'id'>) => Promise<void>;
  updateHoist: (id: number, updates: Partial<Hoist>) => Promise<void>;
  deleteHoist: (id: number) => Promise<void>;
  getHoistById: (id: number) => Hoist | undefined;
  getHoistsByCustomer: (customerId: number) => Hoist[];
}

const HoistsContext = createContext<HoistsContextType | undefined>(undefined);

// Helper: Convert database row (snake_case) → our TypeScript interface (camelCase)
function mapFromDb(row: any): Hoist {
  return {
    id: row.id,
    serialNumber: row.serial_number,
    individualNumber: row.individual_number || undefined,
    model: row.model,
    manufacturer: row.manufacturer || '',
    status: row.status,
    currentSite: row.current_site || '',
    location: row.latitude && row.longitude ? { lat: row.latitude, lng: row.longitude } : undefined,
    windSpeedLimit: row.wind_speed_limit ?? 15,
    customerId: row.customer_id ?? null,
  };
}

// Helper: Convert our interface (camelCase) → database format (snake_case)
function mapToDb(hoist: Partial<Hoist>) {
  const db: any = {};
  if (hoist.serialNumber !== undefined) db.serial_number = hoist.serialNumber;
  if (hoist.individualNumber !== undefined) db.individual_number = hoist.individualNumber;
  if (hoist.model !== undefined) db.model = hoist.model;
  if (hoist.manufacturer !== undefined) db.manufacturer = hoist.manufacturer;
  if (hoist.status !== undefined) db.status = hoist.status;
  if (hoist.currentSite !== undefined) db.current_site = hoist.currentSite;
  if (hoist.location) {
    db.latitude = hoist.location.lat;
    db.longitude = hoist.location.lng;
  }
  if (hoist.windSpeedLimit !== undefined) db.wind_speed_limit = hoist.windSpeedLimit;
  if (hoist.customerId !== undefined) db.customer_id = hoist.customerId;
  return db;
}

export function HoistsProvider({ children }: { children: ReactNode }) {
  const [hoists, setHoists] = useState<Hoist[]>([]);

  const fetchHoists = async () => {
    try {
      // 1. Get current logged in session user
      const { data: { session } } = await supabase.auth.getSession();
      
      let customerIdToFilter: number | null = null;

      if (session?.user?.email) {
        // 2. Fetch user profile from the 'users' table to check role and customer_id
        const { data: userRecord } = await supabase
          .from('users')
          .select('role, customer_id')
          .eq('email', session.user.email)
          .single();

        // 3. If they are a customer, restrict query strictly to their assigned customer_id
        if (userRecord?.role === 'customer' && userRecord?.customer_id) {
          customerIdToFilter = userRecord.customer_id;
        }
      }

      // 4. Build query
      let query = supabase.from('hoists').select('*');

      if (customerIdToFilter !== null) {
        query = query.eq('customer_id', customerIdToFilter);
      }

      const { data, error } = await query.order('id');
      if (error) throw error;

      setHoists((data || []).map(mapFromDb));
    } catch (err) {
      console.error('Error fetching hoists:', err);
    }
  };

  useEffect(() => {
    fetchHoists();
  }, []);

  const addHoist = async (newHoist: Omit<Hoist, 'id'>) => {
    const { data, error } = await supabase
      .from('hoists')
      .insert([mapToDb(newHoist)])
      .select()
      .single();

    if (error) {
      console.error('Error adding hoist:', error);
      alert('Failed to add hoist');
      return;
    }
    if (data) {
      setHoists(prev => [...prev, mapFromDb(data)]);
    }
  };

  const updateHoist = async (id: number, updates: Partial<Hoist>) => {
    const { error } = await supabase
      .from('hoists')
      .update(mapToDb(updates))
      .eq('id', id);

    if (error) {
      console.error('Error updating hoist:', error);
      alert('Failed to update hoist');
      return;
    }
    setHoists(prev => prev.map(h => (h.id === id ? { ...h, ...updates } : h)));
  };

  const deleteHoist = async (id: number) => {
    const { error } = await supabase.from('hoists').delete().eq('id', id);
    if (error) {
      console.error('Error deleting hoist:', error);
      alert('Failed to delete hoist');
      return;
    }
    setHoists(prev => prev.filter(h => h.id !== id));
  };

  const getHoistById = (id: number) => hoists.find(h => h.id === id);
  const getHoistsByCustomer = (customerId: number) => hoists.filter(h => h.customerId === customerId);

  return (
    <HoistsContext.Provider value={{ hoists, addHoist, updateHoist, deleteHoist, getHoistById, getHoistsByCustomer }}>
      {children}
    </HoistsContext.Provider>
  );
}

export function useHoists() {
  const context = useContext(HoistsContext);
  if (!context) throw new Error('useHoists must be used within HoistsProvider');
  return context;
}