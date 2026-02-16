import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar';
import Header from '../Header';
import { useUserProfile } from '../../hooks/useUser';
import { useSession } from '../../hooks/useAuth';

const UserLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { data: session } = useSession();
    const { data: userProfile } = useUserProfile();

    // Prefer fresh profile data
    const user = userProfile || session?.user;

    return (
        <div className="flex h-screen overflow-hidden bg-background-dark relative">
            {/* Background Pattern */}
            <div className="fixed inset-0 z-0 pointer-events-none bg-islamic-pattern opacity-100"></div>
            <div className="fixed inset-0 z-0 pointer-events-none ambient-glow"></div>

            {/* Sidebar (Mobile & Desktop) */}
            <div className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}>
                <Sidebar user={user} onClose={() => setIsSidebarOpen(false)} />
            </div>

            {/* Overlay for Mobile */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10 w-full">
                <Header user={user} onMenuClick={() => setIsSidebarOpen(true)} />

                <main className="flex-1 overflow-y-auto w-full">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default UserLayout;
