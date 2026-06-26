import React, { useEffect, useState } from 'react';
import { useNavigate, Outlet } from '@tanstack/react-router';
import { supabase } from '../lib/supabase';

export default function AuthWrapper({ allowedRole }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          // Not logged in
          navigate({ to: '/' });
          return;
        }

        // For now, if we are just checking for any valid session, we allow it.
        // In a real app, we would fetch the user's role from public.users to enforce `allowedRole`.
        // Example logic:
        // const { data } = await supabase.from('users').select('role').eq('id', session.user.id).single();
        // if (data.role !== allowedRole) throw new Error('Unauthorized');

        setAuthorized(true);
      } catch (error) {
        console.error('Auth error:', error);
        navigate({ to: '/' });
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes (like logout from another tab)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        navigate({ to: '/' });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, allowedRole]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return authorized ? <Outlet /> : null;
}
