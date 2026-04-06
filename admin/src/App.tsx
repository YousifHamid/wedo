import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import Overview from './pages/Overview';
import DriversPage from './pages/DriversPage';
import WalletApprovals from './pages/WalletApprovals';
import ZonePricing from './pages/ZonePricing';
import TripsPage from './pages/TripsPage';
import ComplaintsPage from './pages/ComplaintsPage';
import UsersPage from './pages/UsersPage';
import TransactionsPage from './pages/TransactionsPage';
import DirectTopupPage from './pages/DirectTopupPage';
import StaffPage from './pages/StaffPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
         <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Overview />} />
            <Route path="drivers" element={<DriversPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="wallet" element={<WalletApprovals />} />
            <Route path="trips" element={<TripsPage />} />
            <Route path="zones" element={<ZonePricing />} />
            <Route path="complaints" element={<ComplaintsPage />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="direct-topup" element={<DirectTopupPage />} />
            <Route path="staff" element={<StaffPage />} />
         </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App;
