import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import SidebarAdmin from '../SidebarAdmin';
import HeaderAdmin from '../HeaderAdmin';
import { useUserProfile } from '../../hooks/useUser';

// We might need to pass stats or other data to HeaderAdmin if it requires it?
// HeaderAdmin takes: date, stats, totalPrayers.
// These are usually page-specific (e.g. Global Recap has its own stats).
// BUT, AdminSettings or DataSantri might use a generic header?
// Or maybe HeaderAdmin is ONLY for GlobalRecap?
// Looking at GlobalRecap.jsx (Step 1875), it renders HeaderAdmin explicitly with data from hook.
// Looking at AdminSettings.jsx (not fully viewed but likely), does it use HeaderAdmin?
// If HeaderAdmin depends on specific data, we might need a GenericHeaderAdmin for other pages,
// or we adapt HeaderAdmin to be flexible.
// For now, I will use a placeholder or generic props for HeaderAdmin in the layout, 
// OR I will let the pages render the Header themselves? 
// The plan said "Remove Sidebar and Header from individual page components".
// Dashboard uses Header. GlobalRecap uses HeaderAdmin.
// GlobalRecap passes `rekapData` stats to HeaderAdmin.
// If I move HeaderAdmin to Layout, I can't easily pass that page-specific data up.
// DECISION: 
// 1. For User Board: Header is generic (User Name). So UserLayout can own Header.
// 2. For Admin Board: HeaderAdmin is data-driven (Recap stats). 
//    Option A: Keep HeaderAdmin in pages, but provide "Menu Button" prop to it. 
//              Layout provides "isSidebarOpen" context or props?
//              Layout handles Sidebar. Top bar (Header) is inside page?
//              But Layout wraps the page. 
//              If Layout wraps page, Layout renders Sidebar.
//              Page renders Header.
//              Header needs to trigger `setIsSidebarOpen(true)` which lives in Layout.
//              How to pass handler down? `Outlet context`.
//
//    Option B: Make HeaderAdmin generic in Layout, and Pages put content *below* it.
//              But GlobalRecap header shows stats specific to that page.
//
//    Option C: Use `useOutletContext` to pass `toggleSidebar` function to child pages.
//              Pages (GlobalRecap) pass it to HeaderAdmin.
//              HeaderAdmin renders the button.
//
// Let's go with Option C for Admin, and simple Layout for User (since User header is static).
// Actually, even User-side `Attendance` page might eventually have specific header info?
// Current `Header.jsx` is generic (User info + Date).
// So UserLayout can own Header.
// AdminLayout: I will define it, but for GlobalRecap, maybe I disable the default generic header?
// OR, I make AdminLayout assume generic header, but GlobalRecap *overrides* it?
// Simpler: AdminPages usually share a header structure?
// Let's look at `HeaderAdmin.jsx` again. It expects `stats`.
// If I don't pass stats, it might look empty.
//
// Alternative: Layout only handles Sidebar. Header remains in Pages.
// Layout passes `toggleSidebar` to Outlet.
// `<Outlet context={{ toggleSidebar }} />`
// Pages receive it and pass to Header.
// This is non-breaking and flexible.
//
// BUT for User Dashboard, checking Step 1952, `Header` is just imported and used.
// It's mostly static.
//
// Revised Plan for AdminLayout:
// Render Sidebar.
// Render Outlet.
// Pass `toggleSidebar` via context.
// All Admin pages (GlobalRecap, AdminSettings, etc.) need to accept this context and pass to HeaderAdmin.
//
// Wait, `AdminSettings` likely doesn't have `HeaderAdmin` with stats. 
// It might just have a simple title.
//
// Let's check `AdminSettings.jsx` if possible?
// The user has it open.
//
// For now, I'll create `AdminLayout` that renders Sidebar. 
// I will NOT render HeaderAdmin in Layout yet because of the data dependency.
// I will just handle the Sidebar and the Mobile Overlay.
//
// UserLayout can render Header because it's generic.

const AdminLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { data: user } = useUserProfile();

    return (
        <div className="flex h-screen overflow-hidden bg-background-dark relative">
            {/* Sidebar (Mobile & Desktop) */}
            <div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}>
                <SidebarAdmin />
                {/* Note: SidebarAdmin doesn't take 'close' prop yet, need to add it */}
                {/* Mobile Close Button inside Sidebar? Or Overlay click? */}
                {/* We'll add Overlay below */}
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
                {/* Header is NOT here, it is in Outlet pages */}
                {/* We pass toggle function to pages */}
                <Outlet context={{ toggleSidebar: () => setIsSidebarOpen(true) }} />
            </div>
        </div>
    );
};

export default AdminLayout;
