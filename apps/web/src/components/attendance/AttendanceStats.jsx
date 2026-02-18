import React, { useState, useMemo } from 'react';
import { useAttendanceStats } from '../../hooks/useAttendance';

const AttendanceStats = () => {
    const [filter, setFilter] = useState('month'); // week, month, semester

    // Calculate dates based on filter
    const dateRange = useMemo(() => {
        const now = new Date();
        const endDate = now.toISOString().split('T')[0];
        let startDate = '';

        if (filter === 'week') {
            // Monday of current week
            const day = now.getDay() || 7; // Get current day number, make Sunday 7
            if (day !== 1) {
                now.setHours(-24 * (day - 1));
            }
            startDate = now.toISOString().split('T')[0];
        } else if (filter === 'month') {
            // 1st of current month
            startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        } else if (filter === 'semester') {
            // 6 months ago? OR Fixed semester? 
            // "Semester Ini" usually means last 6 months window or fixed academic semester. 
            // Let's use 6 months window for simplicity as "Semester Ini" implies current ongoing semester.
            const past = new Date();
            past.setMonth(past.getMonth() - 6);
            startDate = past.toISOString().split('T')[0];
        }

        return { startDate, endDate };
    }, [filter]);

    const { data: stats, isLoading } = useAttendanceStats(dateRange);

    // Default values while loading or if no data
    const statsData = stats?.data || {};
    const present = statsData.present || 0;
    const excused = statsData.excused || 0; // Ijin + Sakit
    const absent = statsData.absent || 0;
    const late = statsData.late || 0;

    // Calculate total and percentage dynamically
    // "Hadir" usually includes Late for simple "Presence" stats, or at least they are not Absent.
    // If user wants Late to be punished, they might expect it NOT to be in "Hadir" count,
    // but typically "Kehadiran %" includes all non-absent.
    const totalRecords = present + excused + absent + late;

    // Percentage = (Present + Late + Excused) / Total * 100
    // If Late is considered "Hadir" (just not "Tepat Waktu"), we sum them.
    const percentage = totalRecords > 0
        ? Math.round(((present + late + excused) / totalRecords) * 100)
        : 0;

    const onTimePercentage = (present + late) > 0
        ? Math.round((present / (present + late)) * 100)
        : 0;

    const circumference = 2 * Math.PI * 40; // ~251.33
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Donut Chart Card */}
            <div className="glass-panel rounded-2xl p-6 lg:col-span-1 flex flex-col items-center justify-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <span className="material-symbols-outlined text-6xl text-primary">pie_chart</span>
                </div>
                <h3 className="text-slate-300 font-medium self-start mb-2">
                    Statistik {filter === 'week' ? 'Minggu Ini' : filter === 'semester' ? 'Semester Ini' : 'Bulan Ini'}
                </h3>
                <div className="relative w-48 h-48 my-4">
                    {/* SVG Donut Chart */}
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        {/* Background Circle */}
                        <circle
                            cx="50" cy="50" r="40"
                            fill="none"
                            stroke="rgba(255,255,255,0.08)"
                            strokeWidth="8"
                        />
                        {/* Progress Circle */}
                        <circle
                            cx="50" cy="50" r="40"
                            fill="none"
                            stroke="#1a755d"
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            style={{
                                filter: 'drop-shadow(0 0 8px rgba(26, 117, 93, 0.6))',
                                transition: 'stroke-dashoffset 0.5s ease-in-out',
                            }}
                        />
                    </svg>
                    {/* Center Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-bold text-white">
                            {isLoading ? '...' : `${percentage}%`}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-[0.2em] mt-1">Kehadiran</span>
                    </div>
                </div>
                <div className="w-full flex justify-between px-4 mt-2 text-sm">
                    <div className="text-center">
                        <span className="block text-2xl font-semibold text-white">
                            {isLoading ? '-' : (present + late)}
                        </span>
                        <span className="text-slate-500">Hadir</span>
                    </div>
                    <div className="w-px bg-white/10 h-10"></div>
                    <div className="text-center">
                        <span className="block text-2xl font-semibold text-accent-gold">
                            {isLoading ? '-' : excused}
                        </span>
                        <span className="text-slate-500">Ijin/Sakit</span>
                    </div>
                </div>
            </div>

            {/* Summary & Filters */}
            <div className="lg:col-span-2 flex flex-col gap-6">
                {/* Date Filters */}
                <div className="glass-panel rounded-2xl p-2 flex items-center justify-between">
                    <div className="flex bg-black/20 rounded-xl p-1">
                        <button
                            onClick={() => setFilter('week')}
                            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'week' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-white'}`}
                        >
                            Minggu Ini
                        </button>
                        <button
                            onClick={() => setFilter('month')}
                            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'month' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-white'}`}
                        >
                            Bulan Ini
                        </button>
                        <button
                            onClick={() => setFilter('semester')}
                            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'semester' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-white'}`}
                        >
                            Semester Ini
                        </button>
                    </div>
                    <div className="px-4 text-slate-400 text-sm hidden sm:block">
                        {/* Dynamic Date Range could be added here */}
                        Statistik Kehadiran
                    </div>
                </div>

                {/* Insight Cards - Using static data for insights for now as API might not support it yet, or we assume safe defaults */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                    <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between hover:border-primary/30 transition-colors cursor-pointer">
                        <div className="flex items-start justify-between">
                            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
                                <span className="material-symbols-outlined">timer</span>
                            </div>
                            <span className="text-xs font-medium px-2 py-1 rounded bg-green-500/10 text-green-400">Baik</span>
                        </div>
                        <div className="mt-4">
                            <p className="text-slate-400 text-sm mb-1">Ketepatan Waktu</p>
                            <h4 className="text-2xl font-bold text-white">
                                {isLoading ? '...' : `${onTimePercentage}%`}
                            </h4>
                            <p className="text-xs text-slate-500 mt-1">Persentase kedatangan tepat waktu</p>
                        </div>
                    </div>
                    <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between hover:border-accent-gold/30 transition-colors cursor-pointer">
                        <div className="flex items-start justify-between">
                            <div className="p-3 rounded-xl bg-accent-gold/10 text-accent-gold">
                                <span className="material-symbols-outlined">event_busy</span>
                            </div>
                        </div>
                        <div className="mt-4">
                            <p className="text-slate-400 text-sm mb-1">Total Ketidakhadiran</p>
                            <h4 className="text-2xl font-bold text-white">
                                {isLoading ? '...' : absent} Hari
                            </h4>
                            <p className="text-xs text-slate-500 mt-1">Tanpa keterangan (Alpha)</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AttendanceStats;
