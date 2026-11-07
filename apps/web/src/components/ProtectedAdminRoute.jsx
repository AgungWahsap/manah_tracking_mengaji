import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSession } from '../hooks/useAuth';
import { useUserProfile } from '../hooks/useUser';

/**
 * Route guard — ensures user is logged in AND is an admin.
 * Redirects to dashboard if not admin.
 */
const ProtectedAdminRoute = ({ children }) => {
    // We can use useUserProfile for more reliable role data, 
    // or fall back to session if profile is loading/error.
    const { data: session, isPending: isSessionLoading } = useSession();
    const { data: userProfile, isLoading: isProfileLoading } = useUserProfile();

    const isLoading = isSessionLoading || isProfileLoading;
    const user = userProfile || session?.user;

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-dark">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-gold/30 border-t-gold rounded-full animate-spin"></div>
                    <p className="text-gray-400 text-sm">Verifikasi Akses Admin...</p>
                </div>
            </div>
        );
    }

    if (!session?.user) {
        return <Navigate to="/auth/login" replace />;
    }

    // Role check
    if (user?.role !== 'admin') {
        return <Navigate to="/auth/login" replace />;
    }

    return children;
};

export default ProtectedAdminRoute;
