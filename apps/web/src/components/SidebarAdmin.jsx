import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLogout } from '../hooks/useAuth';
import { useUserProfile } from '../hooks/useUser';

const NAV_ITEMS = [
    { to: '/bulk-attendance', icon: 'fact_check', label: 'Absensi Mengaji' },
    { to: '/global-recap', icon: 'analytics', label: 'Rekap Absensi' },
    { to: '/classes', icon: 'class', label: 'Kelas & Impor/Export' },
    { to: '/data-santri', icon: 'groups', label: 'Data Santri' },
    { to: '/settings', icon: 'schedule', label: 'Waktu Mengaji' },
];

const SidebarAdmin = ({ onClose }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { data: user } = useUserProfile();
    const logoutMutation = useLogout();

    const handleLogout = () => {
        logoutMutation.mutate(undefined, {
            onSuccess: () => navigate('/auth/login'),
        });
    };

    return (
        <aside className="flex h-full w-full flex-col border-r border-glass-border glass-panel">
            <div className="flex items-center gap-3 border-b border-glass-border p-6">
                <img src="/logo-pesantren.png" alt="Logo Pesantren" className="h-12 w-12 object-contain" />
                <div>
                    <h1 className="text-lg font-bold tracking-tight text-white">Absensi Mengaji</h1>
                    <p className="text-xs text-gray-400">Panel Admin</p>
                </div>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-6">
                {NAV_ITEMS.map((item) => {
                    const active = location.pathname === item.to;
                    return (
                        <Link
                            key={item.to}
                            to={item.to}
                            onClick={onClose}
                            className={`group flex items-center gap-3 rounded-lg px-3 py-3 transition-colors ${
                                active ? 'border border-gold/20 bg-primary/40 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                            }`}
                        >
                            <span className={`material-icons-round ${active ? 'text-gold' : 'group-hover:text-gold/80'}`}>{item.icon}</span>
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="border-t border-glass-border p-4">
                <div className="flex items-center gap-3 rounded-lg p-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/30 text-gold">
                        <span className="material-icons-round">admin_panel_settings</span>
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">{user?.name || 'Admin'}</p>
                        <p className="truncate text-xs text-gray-400">Administrator</p>
                    </div>
                    <button
                        type="button"
                        onClick={handleLogout}
                        disabled={logoutMutation.isPending}
                        className="text-gray-400 transition-colors hover:text-white disabled:opacity-50"
                        title="Keluar"
                        aria-label="Keluar"
                    >
                        <span className="material-icons-round text-sm">logout</span>
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default SidebarAdmin;
