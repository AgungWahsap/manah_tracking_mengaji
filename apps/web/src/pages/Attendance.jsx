import React from 'react';
import AttendanceStats from '../components/attendance/AttendanceStats';
import AttendanceTimeline from '../components/attendance/AttendanceTimeline';

const Attendance = () => {
    return (
        <div className="min-h-full">
            {/* Header - Sticky within the scrolling container */}
            <header className="h-24 flex items-center justify-between px-8 border-b border-white/5 bg-background-dark/50 backdrop-blur-md sticky top-0 z-20">
                <div>
                    <h2 className="text-2xl font-bold text-white">Riwayat Kehadiran</h2>
                    <p className="text-sm text-slate-400">Senin, 9 Februari 2026</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => alert('Fitur notifikasi belum tersedia')}
                        className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 transition-colors relative"
                    >
                        <span className="material-symbols-outlined text-xl">notifications</span>
                        <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-background-dark"></span>
                    </button>
                    <button
                        onClick={() => alert('Fitur export PDF belum tersedia')}
                        className="px-4 py-2 bg-primary hover:bg-primary-light text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-primary/20"
                    >
                        <span className="material-symbols-outlined text-sm">download</span>
                        Export PDF
                    </button>
                </div>
            </header>

            {/* Content */}
            <div className="p-8 max-w-6xl mx-auto space-y-8">
                <AttendanceStats />
                <AttendanceTimeline />
            </div>
        </div>
    );
};

export default Attendance;
