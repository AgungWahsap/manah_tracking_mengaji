import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import GlobalRecap from './pages/GlobalRecap';
import DataSantri from './pages/DataSantri';
import AdminSettings from './pages/AdminSettings';
import AdminBulkAttendance from './pages/AdminBulkAttendance';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import AdminLayout from './components/layouts/AdminLayout';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public route */}
                <Route path="/auth/login" element={<Login />} />

                <Route element={<ProtectedAdminRoute><AdminLayout /></ProtectedAdminRoute>}>
                    <Route index element={<Navigate to="/bulk-attendance" replace />} />
                    <Route path="/bulk-attendance" element={<AdminBulkAttendance />} />
                    <Route path="/global-recap" element={<GlobalRecap />} />
                    <Route path="/data-santri" element={<DataSantri />} />
                    <Route path="/settings" element={<AdminSettings />} />
                </Route>

                {/* Redirect unknown routes */}
                <Route path="*" element={<Navigate to="/bulk-attendance" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
