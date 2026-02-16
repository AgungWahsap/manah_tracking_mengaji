import React, { useState } from 'react';
import HeaderAdmin from '../components/HeaderAdmin';
import { useGlobalRecap } from '../hooks/useAttendance';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { id } from 'date-fns/locale';
import RecapDetailModal from '../components/attendance/RecapDetailModal';
import { attendanceService } from '../services/attendance.service';

import { useOutletContext } from 'react-router-dom';

const GlobalRecap = () => {
    const { toggleSidebar } = useOutletContext();
    const [search, setSearch] = useState('');
    const [role, setRole] = useState('Semua Status');

    // Period & Date States
    const [period, setPeriod] = useState('daily'); // 'daily', 'weekly', 'monthly'
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // For Daily
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    const [page, setPage] = useState(1);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const limit = 10;

    // Handle Period Change
    const handlePeriodChange = (newPeriod) => {
        setPeriod(newPeriod);
        setPage(1);
        const today = new Date();

        if (newPeriod === 'daily') {
            const str = date; // keep current selected date or reset? let's use date state
            setStartDate(str);
            setEndDate(str);
        } else if (newPeriod === 'weekly') {
            setStartDate(format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
            setEndDate(format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
        } else if (newPeriod === 'monthly') {
            setStartDate(format(startOfMonth(today), 'yyyy-MM-dd'));
            setEndDate(format(endOfMonth(today), 'yyyy-MM-dd'));
        }
    };

    // Update start/end when daily date changes
    const handleDateChange = (e) => {
        const newDate = e.target.value;
        setDate(newDate);
        setPage(1);
        if (period === 'daily') {
            setStartDate(newDate);
            setEndDate(newDate);
        }
    };

    // Query Request
    const { data: rekapData, isLoading, isError, error, refetch } = useGlobalRecap({
        page,
        limit,
        date, // maintained for backward compatibility or if backend uses it as fallback
        startDate,
        endDate,
        search,
        role: role === 'Semua Status' ? undefined : role,
    });

    const isSummaryMode = period !== 'daily' && rekapData?.mode === 'summary';

    const handleSearchChange = (e) => {
        setSearch(e.target.value);
        setPage(1);
    };

    const handleRoleChange = (e) => {
        setRole(e.target.value);
        setPage(1);
    };

    const getInitials = (name) => {
        return name
            ? name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .substring(0, 2)
                .toUpperCase()
            : '??';
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'present':
                return (
                    <div className="inline-flex items-center justify-center px-2 py-1 rounded bg-green-500/20 text-green-400 border border-green-500/20 text-xs font-medium w-full">
                        <span className="material-icons-round text-[14px] mr-1">check_circle</span> Tepat Waktu
                    </div>
                );
            case 'late':
                return (
                    <div className="inline-flex items-center justify-center px-2 py-1 rounded bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-xs font-medium w-full">
                        <span className="material-icons-round text-[14px] mr-1">schedule</span> Telat
                    </div>
                );
            case 'absent':
                return (
                    <div className="inline-flex items-center justify-center px-2 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-medium w-full">
                        <span className="material-icons-round text-[14px] mr-1">cancel</span> Alpha
                    </div>
                );
            case 'excused':
                return (
                    <div className="inline-flex items-center justify-center px-2 py-1 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-medium w-full">
                        <span className="material-icons-round text-[14px] mr-1">info</span> Izin
                    </div>
                );
            default:
                return (
                    <div className="inline-flex items-center justify-center px-2 py-1 rounded bg-gray-700/50 text-gray-400 border border-gray-600/30 text-xs font-medium w-full">
                        <span className="material-icons-round text-[14px] mr-1">hourglass_empty</span> -
                    </div>
                );
        }
    };

    // Helper to format scheduled time (HH:MM:SS -> HH:MM)
    const formatTime = (timeStr) => timeStr?.substring(0, 5) || '';

    const [isExporting, setIsExporting] = useState(false);

    // Calculate stats
    // Note: stats might be different structure in summary mode? 
    // Backend returns empty stats object for summary mode currently.
    // We might want to fallback or hide stats cards in summary mode if not relevant.
    const stats = rekapData?.stats || { present: 0, late: 0, excused: 0, totalCheckIns: 0 };
    const totalUsers = rekapData?.pagination?.total || 1;

    // Only calculate daily percentage if in daily mode
    const totalPrayers = rekapData?.prayerTimes?.length || 5;
    const maxPossibleCheckIns = totalUsers * totalPrayers;
    const attendancePercentage = (!isSummaryMode && maxPossibleCheckIns > 0)
        ? Math.round((stats.totalCheckIns / maxPossibleCheckIns) * 100)
        : 0;

    // Handle Export CSV
    const handleExport = async () => {
        setIsExporting(true);
        try {
            // Fetch all data (limit 1000 for now)
            const response = await attendanceService.getGlobalRecap({
                page: 1,
                limit: 1000,
                date,
                startDate,
                endDate,
                search,
                role: role === 'Semua Status' ? undefined : role,
            });

            if (!response.data) throw new Error("No data to export");

            if (response.mode === 'summary') {
                // Summary CSV
                const headers = ['No', 'Nama', 'NIS', 'Role', 'Hadir', 'Telat', 'Izin', 'Alpha', 'Sunnah'];
                const csvRows = [headers.join(',')];

                response.data.forEach((row, index) => {
                    const rowData = [
                        index + 1,
                        `"${row.user.name}"`,
                        row.user.nis || '-',
                        row.user.role,
                        row.stats.present,
                        row.stats.late,
                        row.stats.excused,
                        row.stats.alpha,
                        row.stats.sunnah
                    ];
                    csvRows.push(rowData.join(','));
                });

                // Download
                const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", `rekap_summary_${startDate}_${endDate}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

            } else {
                // Daily Detail CSV
                const headers = ['No', 'Nama', 'NIS', 'Status', 'Kamar', ...response.prayerTimes.map(p => p.name)];
                const csvRows = [headers.join(',')];

                response.data.forEach((row, index) => {
                    const rowData = [
                        index + 1,
                        `"${row.user.name}"`,
                        row.user.nis || '-',
                        row.user.role,
                        row.user.asramaRoom ? `Kamar ${row.user.asramaRoom}` : '-',
                    ];

                    // Append attendance for each prayer
                    response.prayerTimes.forEach(p => {
                        if (row.permit) {
                            rowData.push(row.permit.type);
                        } else {
                            const att = row.attendance[p.name];
                            const time = att?.checkInTime ? att.checkInTime.substring(0, 5) : '';
                            rowData.push(att?.status === 'present' ? `Hadir (${time})` : att?.status === 'late' ? `Telat (${time})` : '-');
                        }
                    });

                    csvRows.push(rowData.join(','));
                });

                // Trigger Download
                const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", `rekap_absensi_${date}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }

        } catch (error) {
            console.error("Export failed:", error);
            alert("Gagal mengexport data.");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="flex flex-col h-full relative">
            {/* Note: AdminLayout handles Sidebar and Main Background */}

            {/* Background Decor Gradients - specific to this page content? */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-primary/20 via-transparent to-transparent pointer-events-none z-0"></div>
            <div className="absolute -top-20 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none z-0"></div>

            <HeaderAdmin
                date={period === 'daily' ? date : startDate}
                stats={isSummaryMode ? null : rekapData?.stats}
                totalPrayers={rekapData?.prayerTimes?.length || 5}
                onMenuClick={toggleSidebar}
            />

            {/* Content Body */}
            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar flex flex-col z-10">

                {/* Stats Summary Card (Only show in Daily Mode for now, or adapt for Summary) */}
                {!isSummaryMode && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="glass-card p-4 rounded-xl border border-glass-border relative overflow-hidden">
                            <div className="relative z-10">
                                <p className="text-gray-400 text-xs uppercase tracking-wider">Persentase Kehadiran</p>
                                <h3 className="text-2xl font-bold text-white mt-1">{attendancePercentage}%</h3>
                                <div className="w-full bg-gray-700 h-1.5 rounded-full mt-2 overflow-hidden">
                                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${attendancePercentage}%` }}></div>
                                </div>
                            </div>
                            <div className="absolute -right-2 -bottom-2 text-emerald-500/10">
                                <span className="material-icons-round text-6xl">pie_chart</span>
                            </div>
                        </div>
                        <div className="glass-card p-4 rounded-xl border border-glass-border relative overflow-hidden">
                            <div className="relative z-10">
                                <p className="text-gray-400 text-xs uppercase tracking-wider">Hadir / Telat</p>
                                <h3 className="text-2xl font-bold text-emerald-400 mt-1">{stats.present + stats.late}</h3>
                                <p className="text-xs text-gray-500 mt-1">Dari {maxPossibleCheckIns} total slot</p>
                            </div>
                            <div className="absolute -right-2 -bottom-2 text-emerald-500/10">
                                <span className="material-icons-round text-6xl">check_circle</span>
                            </div>
                        </div>
                        <div className="glass-card p-4 rounded-xl border border-glass-border relative overflow-hidden">
                            <div className="relative z-10">
                                <p className="text-gray-400 text-xs uppercase tracking-wider">Sakit / Izin</p>
                                <h3 className="text-2xl font-bold text-indigo-400 mt-1">{stats.excused}</h3>
                                <p className="text-xs text-gray-500 mt-1">Santri berhalangan</p>
                            </div>
                            <div className="absolute -right-2 -bottom-2 text-indigo-500/10">
                                <span className="material-icons-round text-6xl">medical_services</span>
                            </div>
                        </div>
                        <div className="glass-card p-4 rounded-xl border border-glass-border relative overflow-hidden">
                            <div className="relative z-10">
                                <p className="text-gray-400 text-xs uppercase tracking-wider">Total Santri</p>
                                <h3 className="text-2xl font-bold text-white mt-1">{totalUsers}</h3>
                                <p className="text-xs text-gray-500 mt-1">Terdaftar aktif</p>
                            </div>
                            <div className="absolute -right-2 -bottom-2 text-white/5">
                                <span className="material-icons-round text-6xl">groups</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters & Actions */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4 p-1">
                    <div className="flex items-center gap-3 flex-1 min-w-[300px]">
                        {/* Search */}
                        <div className="relative flex-1 max-w-md group">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-gold transition-colors material-icons-round">
                                search
                            </span>
                            <input
                                type="text"
                                placeholder="Cari nama santri atau staff..."
                                value={search}
                                onChange={handleSearchChange}
                                className="w-full bg-black/20 border border-white/10 text-white text-sm rounded-lg focus:ring-1 focus:ring-gold focus:border-gold block pl-10 p-2.5 placeholder-gray-500 transition-all"
                            />
                        </div>
                        {/* Period Filter */}
                        <div className="relative">
                            <select
                                value={period}
                                onChange={(e) => handlePeriodChange(e.target.value)}
                                className="bg-black/20 border border-white/10 text-gray-300 text-sm rounded-lg focus:ring-gold focus:border-gold block p-2.5 pr-8 cursor-pointer hover:bg-black/30 transition-colors appearance-none"
                            >
                                <option value="daily">Harian</option>
                                <option value="weekly">Mingguan</option>
                                <option value="monthly">Bulanan</option>
                            </select>
                            <span className="material-icons-round absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none text-sm">
                                date_range
                            </span>
                        </div>
                        {/* Role Filter */}
                        <div className="relative">
                            <select
                                value={role}
                                onChange={handleRoleChange}
                                className="bg-black/20 border border-white/10 text-gray-300 text-sm rounded-lg focus:ring-gold focus:border-gold block p-2.5 pr-8 cursor-pointer hover:bg-black/30 transition-colors appearance-none"
                            >
                                <option>Semua Status</option>
                                <option value="santri">Santri</option>
                                <option value="staff">Staff</option>
                                <option value="admin">Admin</option>
                            </select>
                            <span className="material-icons-round absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none text-sm">
                                expand_more
                            </span>
                        </div>
                        {/* Date Filter (Only for Daily) */}
                        {period === 'daily' && (
                            <div className="relative">
                                <input
                                    type="date"
                                    value={date}
                                    onChange={handleDateChange}
                                    className="bg-black/20 border border-white/10 text-gray-300 text-sm rounded-lg focus:ring-gold focus:border-gold block p-2.5 cursor-pointer hover:bg-black/30 transition-colors"
                                />
                            </div>
                        )}
                        {/* Date Range Display (For Weekly/Monthly) */}
                        {period !== 'daily' && (
                            <div className="flex items-center gap-2 bg-black/20 border border-white/10 px-3 py-2.5 rounded-lg text-sm text-gray-300">
                                <span className="material-icons-round text-xs text-gold">event</span>
                                <span>{startDate} s/d {endDate}</span>
                            </div>
                            // TODO: Implement actual Date Range Picker here if custom range needed
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => refetch()}
                            className="flex items-center gap-2 px-4 py-2 bg-primary/40 hover:bg-primary/60 text-white rounded-lg border border-primary-light/30 transition-all text-sm font-medium shadow-lg shadow-primary/10 active:scale-95"
                        >
                            <span className={`material-icons-round text-sm ${isLoading ? 'animate-spin' : ''}`}>refresh</span>
                            <span>{isLoading ? 'Loading...' : 'Refresh Data'}</span>
                        </button>
                        <button
                            onClick={handleExport}
                            disabled={isExporting}
                            className="flex items-center gap-2 px-4 py-2 bg-gold hover:bg-gold-light text-primary-dark rounded-lg font-bold text-sm shadow-lg shadow-gold/20 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="material-icons-round text-sm">download</span>
                            <span>{isExporting ? 'Export CSV' : 'Export CSV'}</span>
                        </button>
                    </div>
                </div>

                {/* Data Table Container */}
                <div className="rounded-xl border border-glass-border glass-panel flex flex-col w-full max-w-full overflow-hidden shrink-0">
                    <div className="overflow-x-auto custom-scrollbar w-full relative max-w-[calc(100vw-2rem)] md:max-w-full">
                        <table className="w-full min-w-[1000px] md:min-w-full text-left border-collapse">
                            <thead className="sticky top-0 z-20 bg-[#0d4a3a]/90 backdrop-blur-md shadow-sm">
                                <tr>
                                    <th className="p-4 text-xs font-semibold tracking-wide text-gray-400 uppercase border-b border-white/10 w-16">
                                        No
                                    </th>
                                    <th className="p-4 text-xs font-semibold tracking-wide text-gray-400 uppercase border-b border-white/10 min-w-[200px]">
                                        Nama Lengkap
                                    </th>
                                    <th className="p-4 text-xs font-semibold tracking-wide text-gray-400 uppercase border-b border-white/10">
                                        Status
                                    </th>

                                    {isSummaryMode ? (
                                        // Summary Columns
                                        <>
                                            <th className="p-4 text-xs font-semibold tracking-wide text-gray-400 uppercase border-b border-white/10 text-center">Hadir</th>
                                            <th className="p-4 text-xs font-semibold tracking-wide text-gray-400 uppercase border-b border-white/10 text-center">Telat</th>
                                            <th className="p-4 text-xs font-semibold tracking-wide text-gray-400 uppercase border-b border-white/10 text-center">Izin</th>
                                            <th className="p-4 text-xs font-semibold tracking-wide text-gray-400 uppercase border-b border-white/10 text-center text-red-400">Alpha</th>
                                            <th className="p-4 text-xs font-semibold tracking-wide text-gray-400 uppercase border-b border-white/10 text-center text-gold">Sunnah</th>
                                        </>
                                    ) : (
                                        // Dynamic Prayer Columns (Daily Mode)
                                        rekapData?.prayerTimes?.map((p) => (
                                            <th
                                                key={p.id}
                                                className="p-4 text-xs font-semibold tracking-wide text-gray-400 uppercase border-b border-white/10 text-center w-24"
                                            >
                                                <div className="flex flex-col items-center">
                                                    <span className="capitalize">{p.name}</span>
                                                    <span className="text-[10px] text-gray-500 font-normal">
                                                        {formatTime(p.scheduledTime)}
                                                    </span>
                                                </div>
                                            </th>
                                        ))
                                    )}

                                    {/* Fallback/Loading columns if no data yet */}
                                    {(!isSummaryMode && (!rekapData?.prayerTimes || rekapData.prayerTimes.length === 0)) && (
                                        <>
                                            <th className="p-4 border-b border-white/10">...</th>
                                            <th className="p-4 border-b border-white/10">...</th>
                                        </>
                                    )}

                                    {!isSummaryMode && (
                                        <th className="p-4 text-xs font-semibold tracking-wide text-gray-400 uppercase border-b border-white/10 text-center">
                                            Aksi
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm text-gray-300">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="10" className="p-8 text-center text-gray-500">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin"></div>
                                                Memuat data rekap...
                                            </div>
                                        </td>
                                    </tr>
                                ) : isError ? (
                                    <tr>
                                        <td colSpan="10" className="p-8 text-center text-red-400">
                                            <div className="flex flex-col items-center gap-2">
                                                <span className="material-icons-round text-4xl">error_outline</span>
                                                <span>Gagal memuat data.</span>
                                                <span className="text-xs text-red-300 bg-red-900/20 px-2 py-1 rounded">
                                                    {error?.response?.data?.error?.message || error?.message || "Unknown Error"}
                                                </span>
                                                <button onClick={() => refetch()} className="text-gold underline text-xs mt-2">Muat Ulang</button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (!rekapData?.data || rekapData.data.length === 0) ? (
                                    <tr>
                                        <td colSpan="10" className="p-8 text-center text-gray-500">
                                            Tidak ada data ditemukan.
                                        </td>
                                    </tr>
                                ) : (
                                    rekapData?.data?.map((row, index) => (
                                        <tr
                                            key={row.user.id}
                                            className="glass-row group hover:bg-gold/5 transition-colors border-b border-white/5"
                                        >
                                            <td className="p-4 font-medium text-gray-500">
                                                {(page - 1) * limit + index + 1}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-xs font-bold text-white shadow-md uppercase">
                                                        {getInitials(row.user.name)}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-white group-hover:text-gold transition-colors">
                                                            {row.user.name}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            ID: {row.user.nis || '-'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 capitalize">
                                                    {row.user.role}
                                                </span>
                                            </td>

                                            {isSummaryMode ? (
                                                // Summary Data Cells
                                                <>
                                                    <td className="p-4 text-center font-bold text-emerald-400">{row.stats.present}</td>
                                                    <td className="p-4 text-center text-yellow-400">{row.stats.late}</td>
                                                    <td className="p-4 text-center text-indigo-400">{row.stats.excused}</td>
                                                    <td className="p-4 text-center font-bold text-red-500 bg-red-500/5">{row.stats.alpha}</td>
                                                    <td className="p-4 text-center text-gold">{row.stats.sunnah}</td>
                                                </>
                                            ) : (
                                                // Daily Data Cells (Existing Logic)
                                                <>
                                                    {row.permit ? (
                                                        <td
                                                            colSpan={rekapData.prayerTimes.length}
                                                            className="p-4 text-center cursor-pointer hover:bg-white/5 transition-colors"
                                                            onClick={() => {
                                                                setSelectedUser({ ...row, date: rekapData.date });
                                                                setIsDetailOpen(true);
                                                            }}
                                                            title={row.permit.status === 'pending' ? 'Menunggu Persetujuan' : 'Klik untuk lihat detail'}
                                                        >
                                                            <div className={`inline-flex items-center justify-center px-4 py-2 rounded text-xs font-medium w-full mx-auto max-w-[80%] ${row.permit.status === 'pending'
                                                                ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                                                                : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                                                                }`}>
                                                                <div className="flex flex-col items-center gap-1">
                                                                    <div className="flex items-center">
                                                                        <span className="material-icons-round text-[14px] mr-2">
                                                                            {row.permit.status === 'pending' ? 'hourglass_empty' : 'medical_services'}
                                                                        </span>
                                                                        {row.permit.status === 'pending' ? 'Menunggu' : (
                                                                            row.permit.type === 'sick' ? 'Sakit' :
                                                                                row.permit.type === 'permission' ? 'Izin' : 'Lainnya'
                                                                        )}
                                                                    </div>
                                                                    {row.permit.reason && (
                                                                        <span className="text-[10px] text-gray-400 italic max-w-[150px] truncate">
                                                                            "{row.permit.reason}"
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                    ) : (
                                                        rekapData?.prayerTimes?.map((p) => {
                                                            const att = row.attendance?.[p.name];
                                                            const status = att?.status || 'absent';
                                                            const isPermit = status === 'excused';

                                                            return (
                                                                <td
                                                                    key={p.id}
                                                                    className={`p-4 text-center ${isPermit ? 'cursor-pointer hover:bg-white/5' : ''}`}
                                                                    onClick={() => {
                                                                        if (isPermit && att.permit) {
                                                                            setSelectedUser({ ...row, permit: att.permit });
                                                                            setIsDetailOpen(true);
                                                                        }
                                                                    }}
                                                                >
                                                                    <div className="flex flex-col items-center">
                                                                        {isPermit && att?.permit?.status === 'pending' ? (
                                                                            <div className="inline-flex items-center justify-center px-2 py-1 rounded bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-xs font-medium w-full">
                                                                                <span className="material-icons-round text-[14px] mr-1">hourglass_empty</span> Menunggu
                                                                            </div>
                                                                        ) : isPermit && att?.permit?.status === 'approved' ? (
                                                                            <div className={`inline-flex items-center justify-center px-2 py-1 rounded text-xs font-medium w-full ${att.permit.type === 'sick'
                                                                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                                                                : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                                                                                }`}>
                                                                                <span className="material-icons-round text-[14px] mr-1">
                                                                                    {att.permit.type === 'sick' ? 'sick' : 'info'}
                                                                                </span>
                                                                                {att.permit.type === 'sick' ? 'Sakit' : 'Izin'}
                                                                            </div>
                                                                        ) : (
                                                                            getStatusBadge(status)
                                                                        )}

                                                                        {att?.checkInTime && (
                                                                            <div className="text-[10px] text-gray-500 mt-1">
                                                                                {formatTime(att.checkInTime)}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            );
                                                        })
                                                    )}

                                                    <td className="p-4 text-center">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedUser({ ...row, date: rekapData.date });
                                                                setIsDetailOpen(true);
                                                            }}
                                                            className="text-gray-400 hover:text-white transition-colors"
                                                            title="Lihat Detail"
                                                        >
                                                            <span className="material-icons-round text-lg">
                                                                visibility
                                                            </span>
                                                        </button>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="p-4 border-t border-glass-border bg-black/20 flex items-center justify-between text-xs text-gray-400">
                        <div>
                            Menampilkan {(page - 1) * limit + 1}-
                            {Math.min(page * limit, rekapData?.pagination?.total || 0)} dari{' '}
                            {rekapData?.pagination?.total || 0} Data
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(Math.max(1, page - 1))}
                                disabled={page === 1}
                                className="p-1 rounded hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="material-icons-round text-base">chevron_left</span>
                            </button>
                            {Array.from({ length: rekapData?.pagination?.totalPages || 0 }).map(
                                (_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setPage(i + 1)}
                                        className={`px-2 py-1 rounded ${page === i + 1
                                            ? 'bg-primary text-white border border-primary-light'
                                            : 'hover:bg-white/10 hover:text-white'
                                            }`}
                                    >
                                        {i + 1}
                                    </button>
                                )
                            )}
                            <button
                                onClick={() =>
                                    setPage(
                                        Math.min(
                                            rekapData?.pagination?.totalPages || 1,
                                            page + 1
                                        )
                                    )
                                }
                                disabled={
                                    page === (rekapData?.pagination?.totalPages || 1)
                                }
                                className="p-1 rounded hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="material-icons-round text-base">chevron_right</span>
                            </button>
                        </div>
                    </div>
                </div>

                <footer className="mt-4 text-center text-xs text-gray-600">
                    © 2024 Manah Tracking System. Developed for Pesantren Administration.
                </footer>
            </div>


            {/* Detail Modal */}
            <RecapDetailModal
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                data={selectedUser}
                date={date}
                onUpdate={refetch}
            />
        </div >
    );
};

export default GlobalRecap;
