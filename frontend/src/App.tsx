import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import SearchesPage from './pages/SearchesPage';
import SearchFormPage from './pages/SearchFormPage';
import ListingsPage from './pages/ListingsPage';
import ListingDetailPage from './pages/ListingDetailPage';
import TelegramPage from './pages/TelegramPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';

const Guard = ({ children }: { children: ReactNode }) =>
  localStorage.getItem('access') ? <>{children}</> : <Navigate to="/login" replace />;

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <Guard>
            <AppLayout />
          </Guard>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="searches" element={<SearchesPage />} />
        <Route path="searches/new" element={<SearchFormPage />} />
        <Route path="searches/:id/edit" element={<SearchFormPage />} />
        <Route path="listings" element={<ListingsPage />} />
        <Route path="listings/:id" element={<ListingDetailPage />} />
        <Route path="telegram" element={<TelegramPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
