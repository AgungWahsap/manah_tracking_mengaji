import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useLogout } from '../hooks/useAuth';

const navItems = [
    { to: '/', icon: 'dashboard', label: 'Beranda' },
    { to: '/attendance', icon: 'history', label: 'Riwayat' },
    { to: '/profile', icon: 'person', label: 'Profil Saya' },
    { to: '#', icon: 'settings', label: 'Pengaturan' },
];

const Sidebar = ({ user, onClose }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const logoutMutation = useLogout();

    const handleLogout = () => {
        logoutMutation.mutate(undefined, {
            onSuccess: () => {
                navigate('/auth/login');
            },
        });
    };

    const userName = user?.name || 'Pengguna';
    const roleLabel = user?.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : 'User';
    // Ensure we handle the profile picture URL correctly (assuming relative or absolute)
    const userImage = user?.profilePicture
        ? (user.profilePicture.startsWith('http') ? user.profilePicture : `http://localhost:3000${user.profilePicture}`)
        : null;

    return (
        <aside className="flex flex-col w-full h-full glass-sidebar transition-all duration-300">
            {/* Logo Area */}
            <div className="h-24 flex items-center px-8 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <img src="/logo-pesantren.png" alt="Logo" className="w-12 h-12 object-contain" />
                    <div>
                        <h1 className="font-bold text-lg tracking-tight text-white">Manah Tracking</h1>
                        <p className="text-xs text-slate-400">Sistem Pesantren</p>
                    </div>
                </div>
            </div>

            {/* Nav Links */}
            <nav className="mt-8 px-4 space-y-2 flex-1">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.to;
                    const isLink = item.to !== '#';
                    const Tag = isLink ? Link : 'a';
                    const props = isLink ? { to: item.to } : { href: '#' };

                    return (
                        <Tag
                            key={item.label}
                            {...props}
                            className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-colors group ${isActive
                                ? 'bg-primary/20 text-white border border-primary/30 shadow-sm'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                            onClick={onClose}
                        >
                            <span className={`material-symbols-outlined transition-colors ${isActive ? 'text-primary-light' : 'text-slate-500 group-hover:text-primary'
                                }`}>{item.icon}</span>
                            <span className="font-medium">{item.label}</span>
                        </Tag>
                    );
                })}
            </nav>

            {/* User Profile Bottom */}
            <div className="p-4 mb-4">
                <div className="glass-panel rounded-2xl p-4 flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-colors">
                    {userImage ? (
                        <img
                            alt="User Avatar"
                            className="w-10 h-10 rounded-full border-2 border-primary/50 object-cover"
                            src={userImage}
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-full border-2 border-primary/50 bg-primary/20 flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-lg">person</span>
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{userName}</p>
                        <p className="text-xs text-slate-400 truncate">{roleLabel}</p>
                    </div>
                    <button onClick={handleLogout} className="text-slate-400 hover:text-white transition-colors" title="Logout">
                        <span className="material-symbols-outlined text-lg">logout</span>
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
