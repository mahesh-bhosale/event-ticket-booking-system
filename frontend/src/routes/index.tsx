import { BrowserRouter, Route, Routes } from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import NotFoundPage from '@/pages/NotFoundPage';

// ─────────────────────────────────────────────────────────────
//  App Router
//  Add new routes here as features are implemented.
// ─────────────────────────────────────────────────────────────
export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />

        {/* Protected Routes (add auth guards when implementing features) */}
        {/* <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} /> */}
        {/* <Route path="/events" element={<EventsPage />} /> */}
        {/* <Route path="/events/:id" element={<EventDetailPage />} /> */}
        {/* <Route path="/bookings" element={<BookingsPage />} /> */}

        {/* Auth Routes */}
        {/* <Route path="/login" element={<LoginPage />} /> */}
        {/* <Route path="/register" element={<RegisterPage />} /> */}

        {/* Catch-all */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
