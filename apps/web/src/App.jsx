import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSession } from './hooks/useAuth';

import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Attendance from './pages/Attendance';
import Profile from './pages/Profile';
import CodeManagement from './pages/CodeManagement';
import GlobalRecap from './pages/GlobalRecap';
import DataSantri from './pages/DataSantri';
import ExportData from './pages/ExportData';
import AdminSettings from './pages/AdminSettings';
import AdminBulkAttendance from './pages/AdminBulkAttendance';
import SunnahReport from './pages/SunnahReport';
import PermitApproval from './pages/PermitApproval';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import UserLayout from './components/layouts/UserLayout';
import AdminLayout from './components/layouts/AdminLayout';

/**
 * Route guard — redirects to login if no active session.
 */
function ProtectedRoute({ children }) {
    const { data: session, isPending } = useSession();

    if (isPending) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-dark">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-gray-400 text-sm">Memuat...</p>
                </div>
            </div>
        );
    }

    if (!session?.user) {
        return <Navigate to="/auth/login" replace />;
    }

    return children;
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public route */}
                <Route path="/auth/login" element={<Login />} />

                {/* Protected routes */}
                {/* Protected routes */}
                <Route element={<ProtectedRoute><UserLayout /></ProtectedRoute>}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/attendance" element={<Attendance />} />
                    <Route path="/profile" element={<Profile />} />
                </Route>

                <Route element={<ProtectedAdminRoute><AdminLayout /></ProtectedAdminRoute>}>
                    <Route path="/global-recap" element={<GlobalRecap />} />
                    <Route path="/code-management" element={<CodeManagement />} />
                    <Route path="/data-santri" element={<DataSantri />} />
                    <Route path="/export-data" element={<ExportData />} />
                    <Route path="/bulk-attendance" element={<AdminBulkAttendance />} />
                    <Route path="/permit-approval" element={<PermitApproval />} />
                    <Route path="/settings" element={<AdminSettings />} />
                    <Route path="/sunnah-report" element={<SunnahReport />} />
                </Route>

                {/* Redirect unknown routes */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
