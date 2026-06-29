import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from '@tanstack/react-router';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import SearchModal from '../components/ui/SearchModal';
import { DashboardSquare01Icon, Building04Icon, Mail01Icon, Settings02Icon, UserGroupIcon } from 'hugeicons-react';

const adminNavigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: DashboardSquare01Icon },
  { name: 'Manajemen Divisi', href: '/admin/divisi', icon: Building04Icon },
  { name: 'Manajemen Kurir', href: '/admin/kurir', icon: UserGroupIcon },
  { name: 'Surat Ekspedisi', href: '/admin/surat', icon: Mail01Icon },
  { name: 'Settings', href: '/admin/settings', icon: Settings02Icon },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        items={adminNavigation}
        title="Admin Menu"
        onSearchClick={() => setSearchOpen(true)}
      />
      
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>

      <SearchModal 
        isOpen={searchOpen} 
        onClose={() => setSearchOpen(false)} 
      />
    </div>
  );
}
