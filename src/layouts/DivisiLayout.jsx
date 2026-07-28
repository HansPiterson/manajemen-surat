import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from '@tanstack/react-router';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { DashboardSquare01Icon, Mail01Icon, Settings02Icon } from 'hugeicons-react';
import { BookOpen } from 'lucide-react';

const divisiNavigation = [
  { label: "Dashboard", to: "/divisi/dashboard", icon: DashboardSquare01Icon },
  { label: "Surat Masuk / Keluar", to: "/divisi/surat", icon: Mail01Icon },
  { label: "Panduan Pengguna", to: "/divisi/panduan", icon: BookOpen },
  { label: "Pengaturan", to: "/divisi/settings", icon: Settings02Icon },
];

export default function DivisiLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Listen to escape key or browser exit fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);
  
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        items={divisiNavigation}
        title="Menu Divisi"
        isHidden={isFullscreen}
        className="hide-on-print"
      />
      
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
          hideProfile={true}
          onToggleFullscreen={toggleFullscreen}
          isFullscreen={isFullscreen}
          className="hide-on-print"
        />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
