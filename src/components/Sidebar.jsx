import React from 'react';
import { Link, useRouterState, useNavigate } from '@tanstack/react-router';
import { Logout02Icon, Cancel01Icon } from 'hugeicons-react';
import { Search } from 'lucide-react';
import { api } from '../lib/api';

export default function Sidebar({ isOpen, onClose, items, title = "Menu", isHidden = false, className = '', onSearchClick }) {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const navigate = useNavigate();

  const handleLogout = () => {
    api.logout();
    navigate({ to: '/' });
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && !isHidden && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 ${className}`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
            <div className="flex items-center gap-2">
              {onSearchClick && (
                <button
                  onClick={onSearchClick}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Search size={20} className="text-slate-600 dark:text-slate-400" />
                </button>
              )}
              <button
                onClick={onClose}
                className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Cancel01Icon size={20} className="text-slate-600 dark:text-slate-400" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-4 py-4">
            {items.map((item, index) => {
              const Icon = item.icon;
              const isActive = currentPath === item.to;
              
              return (
                <Link
                  key={index}
                  to={item.to}
                  onClick={onClose}
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors mb-1 ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon size={20} className="shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="pt-4 mt-auto border-t border-slate-200 dark:border-slate-800 space-y-2">
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
