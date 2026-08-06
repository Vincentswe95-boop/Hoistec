'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

export interface Customer {
  id: number;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  notes?: string;
}

interface CustomersContextType {
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id'>) => Promise<void>;
  updateCustomer: (id: number, updates: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: number) => Promise<void>;
  getCustomerById: (id: number) => Customer | undefined;
}

const CustomersContext = createContext<CustomersContextType | undefined>(undefined);

// Convert database row → our interface
function mapFromDb(row: any): Customer {
  return {
    id: row.id,
    name: row.name,
    contactPerson: row.contact_person || '',
    email: row.email || '',
    phone: row.phone || '',
    address: row.address || '',
    notes: row.notes || undefined,
  };
}

// Convert our interface → database format
function mapToDb(customer: Partial<Customer>) {
  const db: any = {};
  if (customer.name !== undefined) db.name = customer.name;
  if (customer.contactPerson !== undefined) db.contact_person = customer.contactPerson;
  if (customer.email !== undefined) db.email = customer.email;
  if (customer.phone !== undefined) db.phone = customer.phone;
  if (customer.address !== undefined) db.address = customer.address;
  if (customer.notes !== undefined) db.notes = customer.notes;
  return db;
}

export function CustomersProvider({ children }: { children: ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>([]);

  const fetchCustomers = async () => {
    const { data, error } = await supabase.from('customers').select('*').order('id');
    if (error) {
      console.error('Error fetching customers:', error);
      return;
    }
    setCustomers((data || []).map(mapFromDb));
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const addCustomer = async (newCustomer: Omit<Customer, 'id'>) => {
    const { data, error } = await supabase
      .from('customers')
      .insert([mapToDb(newCustomer)])
      .select()
      .single();

    if (error) {
      console.error('Error adding customer:', error);
      alert('Failed to add customer');
      return;
    }
    if (data) {
      setCustomers(prev => [...prev, mapFromDb(data)]);
    }
  };

  const updateCustomer = async (id: number, updates: Partial<Customer>) => {
    const { error } = await supabase
      .from('customers')
      .update(mapToDb(updates))
      .eq('id', id);

    if (error) {
      console.error('Error updating customer:', error);
      alert('Failed to update customer');
      return;
    }
    setCustomers(prev => prev.map(c => (c.id === id ? { ...c, ...updates } : c)));
  };

  const deleteCustomer = async (id: number) => {
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) {
      console.error('Error deleting customer:', error);
      alert('Failed to delete customer');
      return;
    }
    setCustomers(prev => prev.filter(c => c.id !== id));
  };

  const getCustomerById = (id: number) => customers.find(c => c.id === id);

  return (
    <CustomersContext.Provider value={{ customers, addCustomer, updateCustomer, deleteCustomer, getCustomerById }}>
      {children}
    </CustomersContext.Provider>
  );
}

export function useCustomers() {
  const context = useContext(CustomersContext);
  if (!context) throw new Error('useCustomers must be used within CustomersProvider');
  return context;
}
