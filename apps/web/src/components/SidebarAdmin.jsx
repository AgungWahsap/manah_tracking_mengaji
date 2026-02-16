import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUserProfile } from '../hooks/useUser';

const SidebarAdmin = ({ onClose }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { data: user } = useUserProfile();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/auth/login');
    };
    return (
        <aside className="w-full h-full flex flex-col glass-panel border-r border-glass-border relative z-20">
            {/* Logo Area */}
            <div className="p-6 flex items-center gap-3 border-b border-glass-border">
                <img src="/logo-pesantren.png" alt="Logo" className="w-12 h-12 object-contain" />
                <div>
                    <h1 className="font-bold text-lg tracking-tight text-white">Manah Tracking</h1>
                    <p className="text-xs text-gray-400">Admin Panel</p>
                </div>
            </div>


            {/* Navigation Links */}
            <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                <div className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Main Menu</div>

                {/* Rekap Real-time */}
                <Link to="/global-recap" onClick={onClose} className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all group ${location.pathname === '/global-recap' ? 'bg-primary/40 border border-gold/20 text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                    <span className={`material-icons-round transition-colors ${location.pathname === '/global-recap' ? 'text-gold' : 'group-hover:text-gold/80'}`}>dashboard</span>
                    <span className="font-medium">Rekap Real-time</span>
                </Link>

                {/* Absensi Massal */}
                <Link to="/bulk-attendance" onClick={onClose} className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all group ${location.pathname === '/bulk-attendance' ? 'bg-primary/40 border border-gold/20 text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                    <span className={`material-icons-round transition-colors ${location.pathname === '/bulk-attendance' ? 'text-gold' : 'group-hover:text-gold/80'}`}>groups</span>
                    <span className="font-medium">Absensi Massal</span>
                </Link>

                {/* Laporan Sunnah */}
                <Link to="/sunnah-report" onClick={onClose} className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all group ${location.pathname === '/sunnah-report' ? 'bg-primary/40 border border-gold/20 text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                    <span className={`material-icons-round transition-colors ${location.pathname === '/sunnah-report' ? 'text-gold' : 'group-hover:text-gold/80'}`}>volunteer_activism</span>
                    <span className="font-medium">Laporan Sunnah</span>
                </Link>

                {/* Manajemen Kode */}
                <Link to="/code-management" onClick={onClose} className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all group ${location.pathname === '/code-management' ? 'bg-primary/40 border border-gold/20 text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                    <span className={`material-icons-round transition-colors ${location.pathname === '/code-management' ? 'text-gold' : 'group-hover:text-gold/80'}`}>qr_code</span>
                    <span className="font-medium">Manajemen Kode</span>
                </Link>

                {/* Data Santri/Staff */}
                <Link to="/data-santri" onClick={onClose} className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all group ${location.pathname === '/data-santri' ? 'bg-primary/40 border border-gold/20 text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                    <span className={`material-icons-round transition-colors ${location.pathname === '/data-santri' ? 'text-gold' : 'group-hover:text-gold/80'}`}>people</span>
                    <span className="font-medium">Data Santri/Staff</span>
                </Link>

                <div className="px-3 mt-6 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Data & Settings</div>

                <Link to="/export-data" onClick={onClose} className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all group ${location.pathname === '/export-data' ? 'bg-primary/40 border border-gold/20 text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                    <span className={`material-icons-round transition-colors ${location.pathname === '/export-data' ? 'text-gold' : 'group-hover:text-gold/80'}`}>file_download</span>
                    <span className="font-medium">Export Data</span>
                </Link>



                <Link to="/settings" onClick={onClose} className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all group ${location.pathname === '/settings' ? 'bg-primary/40 border border-gold/20 text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                    <span className={`material-icons-round transition-colors ${location.pathname === '/settings' ? 'text-gold' : 'group-hover:text-gold/80'}`}>settings</span>
                    <span className="font-medium">Pengaturan</span>
                </Link>
            </nav>

            {/* User Profile */}
            <div className="p-4 border-t border-glass-border">
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 border border-gray-500 overflow-hidden relative">
                        <img
                            alt="Admin Avatar"
                            className="w-full h-full object-cover opacity-90"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuD2evRczOYJHLWFroVpFKW-eIEXqIYr8TXjlAr0uZzHTMdP57SxouPJI4T110wcBKCSbTPFhxA5u0mne1enHhlIVweIwr9C3vIKZ7UXtUAyi_5bfwjUwntCZVxElUjIDpg_DsizcitjePikTdxDP-m0J-uLrT8OkiDpBfjsS6Ug2_tHWAyo7MLRglA5IJdpR82sZJP6ooGYL27o8miaLC0VGb9a8tZfNIIDNUKKtTtCf3ewWLG2wfTBdVekZSxqqRuvqvH91UcsnP48"
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{user?.name || 'Admin'}</p>
                        <p className="text-xs text-gray-400 truncate">{user?.category || 'Administrator'}</p>
                    </div>
                    <button onClick={handleLogout} className="text-gray-500 hover:text-white transition-colors" title="Logout">
                        <span className="material-icons-round text-sm">logout</span>
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default SidebarAdmin;
