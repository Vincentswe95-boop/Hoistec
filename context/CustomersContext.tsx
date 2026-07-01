'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Customer {
  id: number;
  name: string;              // Company name
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  notes?: string;
}

interface CustomersContextType {
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id'>) => void;
  updateCustomer: (id: number, updates: Partial<Customer>) => void;
  deleteCustomer: (id: number) => void;
  getCustomerById: (id: number) => Customer | undefined;
}

const CustomersContext = createContext<CustomersContextType | undefined>(undefined);

export function CustomersProvider({ children }: { children: ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('hoistec_customers');
    if (saved) {
      setCustomers(JSON.parse(saved));
    }
  }, []);

  // Save to localStorage whenever customers change
  useEffect(() => {
    localStorage.setItem('hoistec_customers', JSON.stringify(customers));
  }, [customers]);

  const addCustomer = (newCustomer: Omit<Customer, 'id'>) => {
    const id = Math.max(0, ...customers.map(c => c.id), 0) + 1;
    setCustomers([...customers, { ...newCustomer, id }]);
  };

  const updateCustomer = (id: number, updates: Partial<Customer>) => {
    setCustomers(prev =>
      prev.map(customer =>
        customer.id === id ? { ...customer, ...updates } : customer
      )
    );
  };

  const deleteCustomer = (id: number) => {
    setCustomers(prev => prev.filter(customer => customer.id !== id));
  };

  const getCustomerById = (id: number) => {
    return customers.find(c => c.id === id);
  };

  return (
    <CustomersContext.Provider
      value={{
        customers,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        getCustomerById,
      }}
    >
      {children}
    </CustomersContext.Provider>
  );
}

export function useCustomers() {
  const context = useContext(CustomersContext);
  if (context === undefined) {
    throw new Error('useCustomers must be used within a CustomersProvider');
  }
  return context;
}