import React, { useMemo } from 'react';
import { useAttendanceHistory } from '../../hooks/useAttendance';

const AttendanceTimeline = () => {
    // Fetch history (default limit 50 for now)
    const { data: historyData, isLoading } = useAttendanceHistory({ limit: 50 });

    // Transform API data to UI structure
    const timelineData = useMemo(() => {
        if (!historyData?.data) return [];

        const records = historyData.data; // Assuming data is an array of records

        // Group by date
        const grouped = records.reduce((acc, record) => {
            // date string from API (e.g., "2026-02-14")
            const dateStr = new Date(record.date).toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });

            if (!acc[dateStr]) {
                acc[dateStr] = {
                    date: dateStr,
                    dotColor: 'bg-primary', // Default, can be logic based
                    isToday: new Date(record.date).toDateString() === new Date().toDateString(),
                    prayers: []
                };
            }

            // Map each record to UI prayer object
            const prayerObj = {
                id: record.id,
                name: record.prayerTime?.name || 'Sholat', // Assuming join or populated data
                location: record.location || 'Masjid Utama',
                icon: getIconForPrayer(record.prayerTime?.name),
                iconBg: getIconBgForPrayer(record.prayerTime?.name),
                iconColor: getIconColorForPrayer(record.prayerTime?.name),
                time: record.checkInTime ? record.checkInTime.substring(0, 5) : '--:--',
                timeStatus: getTimeStatus(record),
                timeStatusColor: getTimeStatusColor(record),
                status: mapStatus(record.status),
                statusStyle: getStatusStyle(record.status),
                borderAccent: record.status !== 'present', // Highlight if not present
            };

            acc[dateStr].prayers.push(prayerObj);
            return acc;
        }, {});

        return Object.values(grouped);
    }, [historyData]);

    if (isLoading) {
        return <div className="text-center py-8 text-slate-400">Memuat riwayat...</div>;
    }

    if (timelineData.length === 0) {
        return <div className="text-center py-8 text-slate-400">Belum ada riwayat kehadiran.</div>;
    }

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-white mb-4">Detail Kehadiran</h3>

            {timelineData.map((day, dayIndex) => (
                <div
                    key={day.date}
                    className={`relative pl-8 border-l border-white/10 ${dayIndex < timelineData.length - 1 ? 'pb-2' : ''}`}
                >
                    {/* Timeline Dot */}
                    <div className={`absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full ${day.dotColor} ring-4 ring-background-dark`}></div>

                    {/* Day Title */}
                    <h4 className="text-lg font-semibold text-white mb-4 -mt-2">{day.date}</h4>

                    {/* Prayer Cards */}
                    <div className="grid gap-3">
                        {day.prayers.map((prayer, idx) => (
                            <div
                                key={prayer.id || idx}
                                className={`glass-panel rounded-xl p-4 flex items-center justify-between group hover:bg-white/5 transition-all ${prayer.borderAccent ? 'border-l-4 border-l-accent-gold' : ''
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-lg ${prayer.iconBg} ${prayer.iconColor} flex items-center justify-center`}>
                                        <span className="material-symbols-outlined text-lg">{prayer.icon}</span>
                                    </div>
                                    <div>
                                        <p className="font-medium text-white">{prayer.name}</p>
                                        <p className="text-xs text-slate-400">{prayer.location}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <p className={`text-sm font-mono ${prayer.time === '--:--' ? 'text-slate-500' : 'text-white'}`}>{prayer.time}</p>
                                        <p className={`text-xs ${prayer.timeStatusColor}`}>{prayer.timeStatus}</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${prayer.statusStyle}`}>
                                        {prayer.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {/* Load More */}
            <div className="flex justify-center pt-4 pb-8">
                <button className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-medium transition-colors border border-white/5">
                    Tampilkan Lebih Banyak
                </button>
            </div>
        </div>
    );
};

// ─── Helper Functions ────────────────────────────────────────────────

function getIconForPrayer(name) {
    if (!name) return 'schedule';
    const lower = name.toLowerCase();
    if (lower.includes('subuh')) return 'wb_twilight';
    if (lower.includes('dhuhur') || lower.includes('zuhur')) return 'wb_sunny';
    if (lower.includes('ashar')) return 'wb_cloudy';
    if (lower.includes('maghrib')) return 'routine';
    if (lower.includes('isya')) return 'nights_stay';
    return 'schedule';
}

function getIconBgForPrayer(name) {
    if (!name) return 'bg-gray-500/10';
    const lower = name.toLowerCase();
    if (lower.includes('subuh')) return 'bg-indigo-500/10';
    if (lower.includes('dhuhur')) return 'bg-orange-500/10';
    if (lower.includes('ashar')) return 'bg-orange-400/10';
    if (lower.includes('maghrib')) return 'bg-orange-600/20';
    if (lower.includes('isya')) return 'bg-indigo-800/20';
    return 'bg-gray-500/10';
}

function getIconColorForPrayer(name) {
    if (!name) return 'text-gray-400';
    const lower = name.toLowerCase();
    if (lower.includes('subuh')) return 'text-indigo-400';
    if (lower.includes('dhuhur')) return 'text-orange-400';
    if (lower.includes('ashar')) return 'text-orange-300';
    if (lower.includes('maghrib')) return 'text-orange-400';
    if (lower.includes('isya')) return 'text-indigo-300';
    return 'text-gray-400';
}

function mapStatus(status) {
    switch (status) {
        case 'present': return 'Hadir';
        case 'late': return 'Terlambat';
        case 'absent': return 'Alpha';
        case 'excused': return 'Ijin';
        case 'sick': return 'Sakit';
        default: return status || '-';
    }
}

function getStatusStyle(status) {
    switch (status) {
        case 'present': return 'bg-primary/20 text-primary-light border-primary/20';
        case 'late': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
        case 'absent': return 'bg-red-500/10 text-red-500 border-red-500/20';
        case 'excused':
        case 'sick': return 'bg-accent-gold/10 text-accent-gold border-accent-gold/20';
        default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
}

function getTimeStatus(record) {
    if (!record.checkInTime) return 'Belum Absen';
    if (record.status === 'late') return 'Terlambat';
    return 'Tepat Waktu';
}

function getTimeStatusColor(record) {
    if (!record.checkInTime) return 'text-slate-500';
    if (record.status === 'late') return 'text-yellow-500';
    return 'text-green-400';
}

export default AttendanceTimeline;
