import React, { useEffect, useState } from 'react';
import { useNavigate, Outlet } from '@tanstack/react-router';
import { supabase } from '../lib/supabase';
import LoadingScreen from './ui/LoadingScreen';

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

        // Fetch user role from database and enforce allowedRole
        let { data: userData, error: roleError } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle();

        if (!userData) {
          // If the profile row is missing from public.users table, attempt self-healing recreation
          if (session.user.email) {
            const isDivision = !session.user.email.includes('admin');
            let divisiId = null;

            if (isDivision) {
              const emailName = session.user.email.split('@')[0];
              const kodeDivisiFromEmail = emailName.includes('_') ? emailName.split('_')[0] : emailName;
              if (kodeDivisiFromEmail) {
                const { data: divisiData } = await supabase
                  .from('divisi')
                  .select('id')
                  .ilike('kode_divisi', kodeDivisiFromEmail)
                  .maybeSingle();
                if (divisiData) divisiId = divisiData.id;
              }
            }

            const { data: insertedUser, error: insertError } = await supabase
              .from('users')
              .insert({
                id: session.user.id,
                email: session.user.email,
                role: isDivision ? 'divisi' : 'admin',
                divisi_id: divisiId,
                nama_lengkap: session.user.email.split('@')[0]
              })
              .select('role')
              .maybeSingle();

            if (!insertError && insertedUser) {
              userData = insertedUser;
            } else {
              throw new Error('User profile record missing in database and auto-recreation failed: ' + (insertError?.message || 'Unknown error'));
            }
          } else {
            throw new Error('User profile not found.');
          }
        }

        if (userData.role !== allowedRole) {
          // Redirect to correct dashboard based on actual role
          if (userData.role === 'admin') {
            navigate({ to: '/admin/dashboard' });
          } else {
            navigate({ to: '/divisi/dashboard' });
          }
          return;
        }

        setAuthorized(true);
      } catch (error) {
        console.error('Auth error:', error);
        navigate({ to: '/' });
      } finally {
        // Add a slight delay for smooth visual transition
        setTimeout(() => {
          setLoading(false);
        }, 800);
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
    return <LoadingScreen />;
  }

  return authorized ? <Outlet /> : null;
}
