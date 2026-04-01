import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import Overview from './pages/Overview';
import DriverApproval from './pages/DriverApproval';
import WalletApprovals from './pages/WalletApprovals';
import ZonePricing from './pages/ZonePricing';
import TripsPage from './pages/TripsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
         <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Overview />} />
            <Route path="approvals" element={<DriverApproval />} />
            <Route path="drivers" element={<DriverApproval />} />
            <Route path="wallet" element={<WalletApprovals />} />
            <Route path="trips" element={<TripsPage />} />
            <Route path="zones" element={<ZonePricing />} />
         </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App;
