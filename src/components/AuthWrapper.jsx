import React, { useEffect, useState } from 'react';
import { useNavigate, Outlet } from '@tanstack/react-router';
import { api } from '../lib/api';
import LoadingScreen from './ui/LoadingScreen';

export default function AuthWrapper({ allowedRole }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if token exists
        if (!api.isAuthenticated()) {
          navigate({ to: '/' });
          return;
        }

        // Get user profile
        const { data: userData, error } = await api.getProfile();
        
        if (error || !userData) {
          api.logout();
          navigate({ to: '/' });
          return;
        }

        // Check role permission
        if (allowedRole && userData.role !== allowedRole) {
          setAuthorized(false);
          navigate({ to: '/' });
          return;
        }

        setAuthorized(true);
      } catch (error) {
        console.error('Auth check failed:', error);
        api.logout();
        navigate({ to: '/' });
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate, allowedRole]);

  if (loading) {
    return <LoadingScreen />;
  }

  return authorized ? <Outlet /> : null;
}
