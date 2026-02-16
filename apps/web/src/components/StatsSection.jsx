import React from 'react';
import { useWeeklyStats, useRecentActivity } from '../hooks/useDashboard';

const StatsSection = () => {
    const { data: stats, isLoading: statsLoading } = useWeeklyStats();
    const { data: activities, isLoading: activityLoading } = useRecentActivity();

    // Unwrap API envelope: { success, data: { percentage, present, ... } }
    const statsData = stats?.data;
    const percentage = statsData?.percentage ?? 0;
    const present = statsData?.present ?? 0;
    const excused = statsData?.excused ?? 0;
    const absent = statsData?.absent ?? 0;

    // Map action types to icons and styles
    const getActivityIcon = (action) => {
        if (action?.includes('check_in') || action?.includes('login')) {
            return { icon: 'login', bgClass: 'bg-primary/20', textClass: 'text-green-400', borderClass: 'border-primary/30' };
        }
        if (action?.includes('check_out') || action?.includes('logout')) {
            return { icon: 'logout', bgClass: 'bg-red-500/10', textClass: 'text-red-400', borderClass: 'border-red-500/20' };
        }
        if (action?.includes('permit') || action?.includes('ijin')) {
            return { icon: 'description', bgClass: 'bg-yellow-500/10', textClass: 'text-accent-gold', borderClass: 'border-yellow-500/20' };
        }
        return { icon: 'info', bgClass: 'bg-blue-500/10', textClass: 'text-blue-400', borderClass: 'border-blue-500/20' };
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return '--:--';
        const date = new Date(dateStr);
        return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    };

    const formatRelativeDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const today = new Date();
        const diffDays = Math.floor((today - date) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Hari Ini';
        if (diffDays === 1) return 'Kemarin';
        return date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Weekly Progress */}
            <div className="glass-panel rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-white font-semibold">Kehadiran Minggu Ini</h3>
                    <button onClick={() => alert('Detail mingguan belum tersedia')} className="text-xs text-primary-light hover:text-white transition-colors">Lihat Detail</button>
                </div>
                <div className="flex items-center gap-4 mb-6">
                    <div className="flex-1">
                        <div className="flex justify-between mb-2">
                            <span className="text-3xl font-bold text-white">
                                {statsLoading ? '...' : `${percentage}%`}
                            </span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                            <div
                                className="bg-gradient-to-r from-primary to-green-400 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="glass-card rounded-lg p-3">
                        <span className="block text-xs text-gray-400 mb-1">Hadir</span>
                        <span className="text-lg font-bold text-white">{statsLoading ? '-' : present}</span>
                    </div>
                    <div className="glass-card rounded-lg p-3">
                        <span className="block text-xs text-gray-400 mb-1">Ijin</span>
                        <span className="text-lg font-bold text-accent-gold">{statsLoading ? '-' : excused}</span>
                    </div>
                    <div className="glass-card rounded-lg p-3">
                        <span className="block text-xs text-gray-400 mb-1">Alpha</span>
                        <span className="text-lg font-bold text-red-400">{statsLoading ? '-' : absent}</span>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="lg:col-span-2 glass-panel rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-white font-semibold">Aktivitas Terkini</h3>
                    <button className="p-1 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
                        <span className="material-icons-round">filter_list</span>
                    </button>
                </div>
                <div className="space-y-3">
                    {activityLoading ? (
                        <div className="text-center py-8 text-gray-500 text-sm">Memuat aktivitas...</div>
                    ) : activities?.data && activities.data.length > 0 ? (
                        activities.data.map((activity) => {
                            const { icon, bgClass, textClass, borderClass } = getActivityIcon(activity.action);
                            return (
                                <div key={activity.id} className="flex items-center justify-between p-3 rounded-xl glass-card glass-card-hover transition-colors group cursor-pointer">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full ${bgClass} flex items-center justify-center ${textClass} border ${borderClass}`}>
                                            <span className="material-icons-round text-xl">{icon}</span>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-white group-hover:text-primary-light transition-colors">{activity.action?.replace(/_/g, ' ')}</h4>
                                            <p className="text-xs text-gray-500">{activity.description || '-'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-white">{formatTime(activity.createdAt)}</p>
                                        <p className="text-xs text-gray-500">{formatRelativeDate(activity.createdAt)}</p>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-8 text-gray-500 text-sm">
                            <span className="material-icons-round text-3xl mb-2 block opacity-30">inbox</span>
                            Belum ada aktivitas terkini
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StatsSection;
