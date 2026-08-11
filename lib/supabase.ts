// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Please check your .env.local file.');
}

// Initialize the Supabase client for database operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Retrieves the current user's role from localStorage 
 * (matching your custom users table login flow).
 */
export async function getUserRole() {
  if (typeof window === 'undefined') return null;
  
  try {
    const userStr = localStorage.getItem('renta_user');
    if (!userStr) return null;
    
    const user = JSON.parse(userStr);
    return user?.role || null;
  } catch (err) {
    console.error('Failed to get user role from localStorage:', err);
    return null;
  }
}
