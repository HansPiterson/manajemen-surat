import React, { useState } from 'react';
import { Outlet, useNavigate } from '@tanstack/react-router';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { DashboardSquare01Icon, Building04Icon, Mail01Icon, Settings02Icon } from 'hugeicons-react';

const adminNavigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: DashboardSquare01Icon },
  { name: 'Manajemen Divisi', href: '/admin/divisi', icon: Building04Icon },
  { name: 'Surat Ekspedisi', href: '/admin/surat', icon: Mail01Icon },
  { name: 'Settings', href: '/admin/settings', icon: Settings02Icon },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        items={adminNavigation}
        title="Admin Menu"
      />
      
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
