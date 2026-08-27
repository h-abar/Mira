import { type ReactElement } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import ClientsPage from '../pages/ClientsPage';
import AppointmentsPage from '../pages/AppointmentsPage';
import ServicesPage from '../pages/ServicesPage';
import EmployeesPage from '../pages/EmployeesPage';
import InventoryPage from '../pages/InventoryPage';
import AccountingPage from '../pages/AccountingPage';
import ReportsPage from '../pages/ReportsPage';
import POSPage from '../pages/POSPage';
import OffersPage from '../pages/OffersPage';
import SuppliersPage from '../pages/SuppliersPage';
import PurchasesPage from '../pages/PurchasesPage';
import AttendancePage from '../pages/AttendancePage';
import UsersPage from '../pages/UsersPage';
import SettingsPage from '../pages/SettingsPage';
import BranchesPage from '../pages/BranchesPage';
import MembershipsPage from '../pages/MembershipsPage';
import GiftCardsPage from '../pages/GiftCardsPage';
import CampaignsPage from '../pages/CampaignsPage';
import NotificationsPage from '../pages/NotificationsPage';
import LandingPage from '../pages/public/LandingPage';
import BookingPage from '../pages/public/BookingPage';
import BookingStatusPage from '../pages/public/BookingStatusPage';
import { useAuthStore } from '../stores/authStore';

export function ProtectedRoute({ children }: { children: ReactElement }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Customer Portal Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/booking" element={<BookingPage />} />
      <Route path="/booking-status" element={<BookingStatusPage />} />

      {/* Staff Auth Route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="appointments" element={<AppointmentsPage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="employees" element={<EmployeesPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="accounting" element={<AccountingPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="pos" element={<POSPage />} />
        <Route path="offers" element={<OffersPage />} />
        <Route path="suppliers" element={<SuppliersPage />} />
        <Route path="purchases" element={<PurchasesPage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="branches" element={<BranchesPage />} />
        <Route path="memberships" element={<MembershipsPage />} />
        <Route path="giftcards" element={<GiftCardsPage />} />
        <Route path="campaigns" element={<CampaignsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}