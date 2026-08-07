// app/ClientLayout.tsx
'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Plus, LogOut, Menu, X } from 'lucide-react';
import { supabase, getUserRole } from '@/lib/supabase';

// 1. Import ALL your providers
import { CustomersProvider } from '../context/CustomersContext';
import { HoistsProvider } from '../context/HoistsContext';
import { RepairsProvider } from '../context/RepairsContext';
import { UserProvider } from '../context/UserContext';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';
  const [userRole, setUserRole] = useState<string>('admin');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const role = await getUserRole();
        if (role) {
          setUserRole(role);
        }
      } catch (err) {
        console.error('Error fetching user role:', err);
      }
    };

    fetchUserRole();
  }, []);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  if (isLoginPage) {
    return (
      <UserProvider>
        <CustomersProvider>
          <HoistsProvider>
            <RepairsProvider>
              <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                {children}
              </main>
            </RepairsProvider>
          </HoistsProvider>
        </CustomersProvider>
      </UserProvider>
    );
  }

  return (
    <UserProvider>
      <CustomersProvider>
        <HoistsProvider>
          <RepairsProvider>
            <div className="flex h-screen overflow-hidden bg-gray-50 relative">
              {/* Mobile Backdrop Overlay */}
              {isSidebarOpen && (
                <div 
                  className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-xs transition-opacity" 
                  onClick={() => setIsSidebarOpen(false)} 
                />
              )}

              {/* Global Sidebar (Collapsible & Mobile Drawer) */}
              <aside className={`
                fixed lg:static inset-y-0 left-0 z-50 
                w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 
                transform transition-transform duration-300 ease-in-out
                ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
              `}>
                <div className="p-6 border-b flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#FE5000] rounded-xl flex items-center justify-center shadow-md">
                      <span className="text-white font-bold text-xl">H</span>
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-gray-900">Hoistec</h1>
                      <span className="text-xs text-orange-600 font-semibold uppercase tracking-wider">
                        {userRole === 'customer' ? 'Customer Portal' : 'Management'}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsSidebarOpen(false)}
                    className="lg:hidden text-gray-400 hover:text-gray-600 p-1 rounded-lg"
                    aria-label="Close Sidebar"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
                  <Link href="/" className="sidebar-link flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-orange-50 hover:text-[#FE5000] text-gray-700 font-medium text-sm transition-colors">
                    Dashboard
                  </Link>
                  <Link href="/hoists" className="sidebar-link flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-orange-50 hover:text-[#FE5000] text-gray-700 font-medium text-sm transition-colors">
                    Hoists
                  </Link>
                  <Link href="/repairs" className="sidebar-link flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-orange-50 hover:text-[#FE5000] text-gray-700 font-medium text-sm transition-colors">
                    Schedule & Repairs
                  </Link>

                  {/* Hide Reports and Customers from Customer role */}
                  {userRole !== 'customer' && (
                    <>
                      <Link href="/reports" className="sidebar-link flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-orange-50 hover:text-[#FE5000] text-gray-700 font-medium text-sm transition-colors">
                        Reports
                      </Link>
                      <Link href="/customers" className="sidebar-link flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-orange-50 hover:text-[#FE5000] text-gray-700 font-medium text-sm transition-colors">
                        Customers
                      </Link>
                    </>
                  )}

                  {userRole === 'admin' && (
                    <>
                      <div className="pt-4 pb-2">
                        <span className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Administration</span>
                      </div>
                      <Link href="/users" className="sidebar-link flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-orange-50 hover:text-[#FE5000] text-gray-700 font-medium text-sm transition-colors">
                        User Management
                      </Link>
                    </>
                  )}
                </nav>
              </aside>

              {/* Main Layout Area */}
              <div className="flex-1 flex flex-col overflow-hidden w-full">
                {/* Top Header Banner with Menu Toggle */}
                <header className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 flex items-center justify-between flex-shrink-0 shadow-sm gap-2">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                      className="p-2 rounded-xl text-gray-600 hover:bg-orange-50 hover:text-[#FE5000] transition-colors"
                      aria-label="Toggle Sidebar"
                    >
                      <Menu className="w-5 h-5" />
                    </button>
                    <h1 className="text-base md:text-xl font-bold text-gray-900 truncate">Construction Hoist Management</h1>
                  </div>
                  
                  <div className="flex items-center gap-2 md:gap-4">
                    {userRole !== 'customer' && (
                      <Link href="/repairs" className="hidden sm:inline-flex items-center gap-2 px-3 md:px-4 py-2 bg-[#FE5000] text-white font-medium text-xs md:text-sm rounded-xl hover:bg-orange-600 transition-colors shadow-sm">
                        <Plus className="w-4 h-4" /> Schedule Task
                      </Link>
                    )}

                    <div className="flex items-center gap-2 md:gap-3 pl-2 md:pl-4 border-l border-gray-200">
                      <div className="w-8 h-8 md:w-9 md:h-9 bg-orange-100 text-[#FE5000] font-bold rounded-full flex items-center justify-center text-xs md:text-sm">
                        U
                      </div>
                      <Link href="/profile" className="hidden lg:inline text-xs font-semibold text-gray-700 hover:text-[#FE5000] transition-colors">
                        EDIT PROFILE
                      </Link>
                      <Link href="/login" className="flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition-colors shadow-sm">
                        <LogOut className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Sign Out</span>
                      </Link>
                    </div>
                  </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-auto bg-gray-50">
                  {children}
                </main>
              </div>
            </div>
          </RepairsProvider>
        </HoistsProvider>
      </CustomersProvider>
    </UserProvider>
  );
}