// context/CustomersContext.tsx
"use client";

import React, { createContext, useContext } from 'react';
import { supabase } from '@/lib/supabase';

export interface Customer {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
}

interface CustomersContextType {
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id'>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  updateCustomer: (id: string, customer: Partial<Customer>) => Promise<void>;
  getCustomerById: (id: string | number) => Customer | undefined;
  loading: boolean;
}

const CustomersContext = createContext<CustomersContextType | undefined>(undefined);

export function CustomersProvider({ children }: { children: React.ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      const formatted = (data || []).map((c: any) => ({
        id: c.id.toString(),
        name: c.name,
        contactPerson: c.contact_person || c.contactPerson,
        email: c.email,
        phone: c.phone,
        address: c.address,
      }));

      setCustomers(formatted);
    } catch (error) {
      console.error('Error fetching customers from Supabase:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const getCustomerById = (id: string | number) => {
    return customers.find(c => String(c.id) === String(id));
  };

  const addCustomer = async (customerData: Omit<Customer, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([
          {
            name: customerData.name,
            contact_person: customerData.contactPerson,
            email: customerData.email,
            phone: customerData.phone,
            address: customerData.address,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const newCustomer: Customer = {
          id: data.id.toString(),
          name: data.name,
          contactPerson: data.contact_person || data.contactPerson,
          email: data.email,
          phone: data.phone,
          address: data.address,
        };
        setCustomers(prev => [newCustomer, ...prev]);
      }
    } catch (error: any) {
      console.error('Error in addCustomer:', error);
      alert(`Failed to add customer: ${error.message || error}`);
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCustomers(prev => prev.filter(c => String(c.id) !== String(id)));
    } catch (error: any) {
      console.error('Error in deleteCustomer:', error);
      alert(`Failed to delete customer: ${error.message || error}`);
    }
  };

  const updateCustomer = async (id: string, customerData: Partial<Customer>) => {
    try {
      const updatePayload: any = {};
      if (customerData.name !== undefined) updatePayload.name = customerData.name;
      if (customerData.contactPerson !== undefined) updatePayload.contact_person = customerData.contactPerson;
      if (customerData.email !== undefined) updatePayload.email = customerData.email;
      if (customerData.phone !== undefined) updatePayload.phone = customerData.phone;
      if (customerData.address !== undefined) updatePayload.address = customerData.address;

      const { error } = await supabase
        .from('customers')
        .update(updatePayload)
        .eq('id', id);

      if (error) throw error;

      setCustomers(prev =>
        prev.map(c => (String(c.id) === String(id) ? { ...c, ...customerData } : c))
      );
    } catch (error: any) {
      console.error('Error in updateCustomer:', error);
      alert(`Failed to update customer: ${error.message || error}`);
    }
  };

  return (
    <CustomersContext.Provider value={{ customers, addCustomer, deleteCustomer, updateCustomer, getCustomerById, loading }}>
      {children}
    </CustomersContext.Provider>
  );
}

export function useCustomers() {
  const context = useContext(CustomersContext);
  if (!context) {
    throw new Error('useCustomers must be used within a CustomersProvider');
  }
  return context;
}
