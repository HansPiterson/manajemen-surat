import React from 'react';
import {
  Outlet,
  RouterProvider,
  createRouter,
  createRoute,
  createRootRoute,
} from '@tanstack/react-router';
import { ThemeProvider } from './contexts/ThemeContext';
import AuthWrapper from './components/AuthWrapper';

import Login from './pages/Login';

// Admin Imports
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import DivisiManagement from './pages/admin/DivisiManagement';
import KurirManagement from './pages/admin/KurirManagement';
import AdminSuratViewer from './pages/admin/SuratViewer';
import AdminSuratDetail from './pages/admin/SuratDetail';
import Settings from './pages/admin/Settings';
import Analytics from './pages/admin/Analytics';
import UserGuide from './pages/UserGuide';

// Divisi Imports
import DivisiLayout from './layouts/DivisiLayout';
import DivisiDashboard from './pages/divisi/Dashboard';
import DivisiSuratViewer from './pages/divisi/SuratViewer';
import DivisiSuratDetail from './pages/divisi/SuratDetail';
import CourierPairing from './pages/divisi/CourierPairing';

// Create a root route
const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

// Create an index route mapping to the Login page
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Login,
});

// --- ADMIN ROUTES ---
const adminAuthRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'adminAuth',
  component: () => <AuthWrapper allowedRole="admin" />
});

const adminRoute = createRoute({
  getParentRoute: () => adminAuthRoute,
  path: '/admin',
  component: AdminLayout,
});

const adminDashboardRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/dashboard',
  component: AdminDashboard,
});

const divisiManagementRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/divisi',
  component: DivisiManagement,
});

const kurirManagementRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/kurir',
  component: KurirManagement,
});

const adminSuratRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/surat',
  component: AdminSuratViewer,
});

const adminSuratDetailRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/surat/$nomorSurat',
  component: AdminSuratDetail,
});

const settingsRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/settings',
  component: Settings,
});

const analyticsRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/analytics',
  component: Analytics,
});

const adminGuideRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/panduan',
  component: UserGuide,
});

// --- DIVISI ROUTES ---
const divisiAuthRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'divisiAuth',
  component: () => <AuthWrapper allowedRole="divisi" />
});

const divisiRoute = createRoute({
  getParentRoute: () => divisiAuthRoute,
  path: '/divisi',
  component: DivisiLayout,
});

const divisiDashboardRoute = createRoute({
  getParentRoute: () => divisiRoute,
  path: '/dashboard',
  component: DivisiDashboard,
});

const divisiSuratRoute = createRoute({
  getParentRoute: () => divisiRoute,
  path: '/surat',
  component: DivisiSuratViewer,
});

const divisiSuratDetailRoute = createRoute({
  getParentRoute: () => divisiRoute,
  path: '/surat/$nomorSurat',
  component: DivisiSuratDetail,
});

const divisiCourierPairingRoute = createRoute({
  getParentRoute: () => divisiRoute,
  path: '/kurir',
  component: CourierPairing,
});

const divisiSettingsRoute = createRoute({
  getParentRoute: () => divisiRoute,
  path: '/settings',
  component: Settings,
});

const divisiGuideRoute = createRoute({
  getParentRoute: () => divisiRoute,
  path: '/panduan',
  component: UserGuide,
});

// Create the route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  adminAuthRoute.addChildren([
    adminRoute.addChildren([
      adminDashboardRoute, 
      divisiManagementRoute, 
      kurirManagementRoute,
      adminSuratRoute,
      adminSuratDetailRoute,
      settingsRoute,
      analyticsRoute,
      adminGuideRoute
    ])
  ]),
  divisiAuthRoute.addChildren([
    divisiRoute.addChildren([
      divisiDashboardRoute,
      divisiSuratRoute,
      divisiSuratDetailRoute,
      divisiCourierPairingRoute,
      divisiSettingsRoute,
      divisiGuideRoute
    ])
  ])
]);

// Create the router
const router = createRouter({ routeTree });

export default function App() {
  return (
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}
