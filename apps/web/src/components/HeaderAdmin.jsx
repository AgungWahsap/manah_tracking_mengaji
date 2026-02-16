import React from 'react';

const HeaderAdmin = ({ date, stats, totalPrayers = 5, onMenuClick }) => {
    // Dates
    const targetDate = date ? new Date(date) : new Date();

    // Hijri Date
    const hijriDate = new Intl.DateTimeFormat('id-ID-u-ca-islamic', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(targetDate);

    // Gregorian Date
    const gregorianDate = new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(targetDate);

    // Stats
    const totalUsers = stats?.totalUsers || 1;
    const maxPossibleCheckIns = totalUsers * totalPrayers; // Total check-ins possible for the day
    const currentCheckIns = stats?.totalCheckIns || 0;

    // Percentage
    const percentage = maxPossibleCheckIns > 0
        ? Math.round((currentCheckIns / maxPossibleCheckIns) * 100)
        : 0;

    // Radius and Circumference for SVG
    const radius = 16;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <header className="h-20 flex items-center justify-between px-8 z-10 border-b border-glass-border glass-panel m-4 rounded-xl mb-0">
            <div className="flex items-center gap-4">
                {/* Mobile Menu Button */}
                <button
                    onClick={onMenuClick}
                    className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
                >
                    <span className="material-icons-round text-2xl">menu</span>
                </button>

                <div>
                    <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">Rekap Absensi Global</h2>
                    <div className="hidden md:flex items-center gap-2 text-sm text-gray-400 mt-0.5">
                        <span className="material-icons-round text-gold text-sm">calendar_today</span>
                        <span>{hijriDate} H</span>
                        <span className="text-gray-600">•</span>
                        <span>{gregorianDate}</span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-4">
                {/* Stat Widget */}
                <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-black/20 border border-white/5">
                    <div className="text-right">
                        <div className="text-xs text-gray-400">Kehadiran Hari Ini</div>
                        <div className="text-lg font-bold text-white">{percentage}%</div>
                    </div>
                    <div className="w-10 h-10 relative flex items-center justify-center">
                        <svg className="transform -rotate-90 w-10 h-10">
                            <circle className="text-gray-700" cx="20" cy="20" fill="transparent" r={radius} stroke="currentColor" strokeWidth="3"></circle>
                            <circle
                                className="text-gold transition-all duration-1000 ease-out"
                                cx="20"
                                cy="20"
                                fill="transparent"
                                r={radius}
                                stroke="currentColor"
                                strokeDasharray={circumference}
                                strokeDashoffset={offset}
                                strokeWidth="3"
                                strokeLinecap="round"
                            ></circle>
                        </svg>
                    </div>
                </div>

                {/* Notifications */}
                <button className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-300 relative transition-colors">
                    <span className="material-icons-round">notifications</span>
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 border border-black"></span>
                </button>
            </div>
        </header>
    );
};

export default HeaderAdmin;
