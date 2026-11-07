import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import SidebarAdmin from '../SidebarAdmin';

const AdminLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="relative flex h-screen overflow-hidden bg-background-dark">
            <div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
                isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}>
                <SidebarAdmin onClose={() => setIsSidebarOpen(false)} />
            </div>
            {isSidebarOpen && (
                <button
                    type="button"
                    aria-label="Tutup menu"
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
            <div className="relative z-10 flex h-full w-full flex-1 flex-col overflow-hidden">
                <Outlet context={{ toggleSidebar: () => setIsSidebarOpen(true) }} />
            </div>
        </div>
    );
};

export default AdminLayout;
