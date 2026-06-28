import React from 'react';
import { Link, useRouterState, useNavigate } from '@tanstack/react-router';
import { Logout02Icon } from 'hugeicons-react';
import { supabase } from '../lib/supabase';

export default function Sidebar({ isOpen, onClose, items, title = "Menu", isHidden = false, className = '' }) {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate({ to: '/' });
    } catch (error) {
      alert('Error logging out: ' + error.message);
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && !isHidden && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isHidden ? 'hidden' : 'lg:static lg:translate-x-0'} ${className}`}
      >
        <div className="flex h-full flex-col px-3 py-4">
          <div className="mb-6 px-4">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">{title}</h2>
          </div>
          
          <nav className="flex-1 space-y-1 overflow-y-auto">
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath.startsWith(item.href);
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => {
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={`group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon 
                    size={20} 
                    className={`shrink-0 ${
                      isActive 
                        ? 'text-slate-900 dark:text-slate-100' 
                        : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-400'
                    }`} 
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="pt-4 mt-auto border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={handleLogout}
              className="w-full group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
            >
              <Logout02Icon size={20} className="shrink-0" />
              Keluar (Logout)
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
