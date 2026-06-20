import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/common/ProtectedRoute';
import AppShell from '../components/layout/AppShell';
import PageLoader from '../components/common/PageLoader';

// Lazy load page components for code splitting
const LoginPage = lazy(() => import('../pages/LoginPage'));
const RegisterPage = lazy(() => import('../pages/RegisterPage'));
const EventListPage = lazy(() => import('../pages/EventListPage'));
const EventDetailPage = lazy(() => import('../pages/EventDetailPage'));
const BookingSuccessPage = lazy(() => import('../pages/BookingSuccessPage'));
const BookingHistoryPage = lazy(() => import('../pages/BookingHistoryPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

// Admin Pages
const AdminRoute = lazy(() => import('../components/common/AdminRoute'));
const AdminEventListPage = lazy(() => import('../pages/admin/AdminEventListPage'));
const AdminEventFormPage = lazy(() => import('../pages/admin/AdminEventFormPage'));

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Core Pages wrapped in Auth Guard and AppShell */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppShell>
                <EventListPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/events/:id"
          element={
            <ProtectedRoute>
              <AppShell>
                <EventDetailPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/booking/success"
          element={
            <ProtectedRoute>
              <AppShell>
                <BookingSuccessPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings/history"
          element={
            <ProtectedRoute>
              <AppShell>
                <BookingHistoryPage />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* Protected Admin Routes */}
        <Route
          path="/admin/events"
          element={
            <AdminRoute>
              <AppShell>
                <AdminEventListPage />
              </AppShell>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/events/create"
          element={
            <AdminRoute>
              <AppShell>
                <AdminEventFormPage />
              </AppShell>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/events/:id/edit"
          element={
            <AdminRoute>
              <AppShell>
                <AdminEventFormPage />
              </AppShell>
            </AdminRoute>
          }
        />

        {/* 404 Catch All */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;
