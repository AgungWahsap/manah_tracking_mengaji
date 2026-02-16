import React, { useState, useEffect } from 'react';
// import SidebarAdmin from '../components/SidebarAdmin'; // Removed
import { useOutletContext } from 'react-router-dom';
// import { attendanceService } from '../services/attendance.service';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from 'date-fns';

const ExportData = () => {
    // State for form selections
    const [period, setPeriod] = useState('daily');
    const [formatFile, setFormatFile] = useState('excel'); // renamed to avoid conflict with imported format
    const [userCategory, setUserCategory] = useState('all');
    const [includeLog, setIncludeLog] = useState(false);

    // Date states
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    const [isExporting, setIsExporting] = useState(false);

    // Auto-set dates based on period
    useEffect(() => {
        const today = new Date();
        if (period === 'daily') {
            const str = today.toISOString().split('T')[0];
            setStartDate(str);
            setEndDate(str);
        } else if (period === 'weekly') {
            setStartDate(format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
            setEndDate(format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
        } else if (period === 'monthly') {
            setStartDate(format(startOfMonth(today), 'yyyy-MM-dd'));
            setEndDate(format(endOfMonth(today), 'yyyy-MM-dd'));
        }
    }, [period]);

    const handleExport = async () => {
        if (formatFile === 'pdf') {
            alert("Fitur ekspor PDF sedang dalam pengembangan. Silakan gunakan Excel untuk saat ini.");
            return;
        }

        setIsExporting(true);
        try {
            const { attendanceService } = await import('../services/attendance.service');
            console.log("Debug Dynamic AttendanceService:", attendanceService);

            const query = {
                startDate,
                endDate,
                role: userCategory === 'all' ? undefined : userCategory,
            };

            const response = await attendanceService.getReport(query);

            if (!response.data || response.data.length === 0) {
                alert("Tidak ada data untuk periode yang dipilih.");
                setIsExporting(false);
                return;
            }

            // Generate CSV
            const csvRows = [];

            // Header
            csvRows.push([
                'No',
                'Nama',
                'NIS',
                'Role',
                'Total Hadir',
                'Alfa',
                'Izin/Sakit (Approved)',
                'Total Sunnah',
                'Detail Sunnah (Jumlah)',
                'Keterangan'
            ].join(','));

            response.data.forEach((item, index) => {
                const { user, stats } = item;

                // Format Sunnah Details (e.g., "Tahajud: 5, Dhuha: 2")
                const sunnahDetails = stats.sunnah?.details
                    ? Object.entries(stats.sunnah.details)
                        .map(([practice, count]) => `${practice}: ${count}`)
                        .join(' | ')
                    : '-';

                const row = [
                    index + 1,
                    `"${user.name}"`,
                    user.nis || '-',
                    user.role,
                    stats.present, // Total Hadir (only present, late is alpha)
                    stats.alpha,   // New Alpha Column
                    stats.excused,
                    stats.sunnah?.total || 0,
                    `"${sunnahDetails}"`,
                    // If detailed logs requested, we might need a different format, but for now just summary
                    includeLog ? "Detail log tersedia di laporan harian" : "-"
                ];
                csvRows.push(row.join(','));
            });

            // Download
            const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `Laporan_Absensi_${userCategory}_${startDate}_${endDate}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Optional: Save to history (mock)
            // Need a real backend endpoint to save generated reports? 
            // For now, just client side download.

        } catch (error) {
            console.error("Export error:", error);
            alert("Gagal mengunduh laporan: " + (error.message || "Kesalahan server"));
        } finally {
            setIsExporting(false);
        }
    };

    const { toggleSidebar } = useOutletContext(); // Get toggle function

    return (
        <div className="flex flex-col h-full relative">
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-primary/20 via-transparent to-transparent pointer-events-none z-0"></div>
            <div className="absolute -top-20 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none z-0"></div>

            <header className="h-20 flex items-center justify-between px-8 z-10 border-b border-glass-border glass-panel m-4 rounded-xl mb-0">
                <div className="flex items-center gap-4">
                    {/* Mobile Menu Button */}
                    <button
                        onClick={toggleSidebar}
                        className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <span className="material-icons-round text-2xl">menu</span>
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">Ekspor Data Laporan</h2>
                        <div className="flex items-center gap-2 text-sm text-gray-400 mt-0.5">
                            <span className="material-icons-round text-gold text-sm">description</span>
                            <span>Pilih parameter untuk mengunduh laporan absensi</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-300 relative transition-colors">
                        <span className="material-icons-round">notifications</span>
                        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 border border-black"></span>
                    </button>
                </div>
            </header>

            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar z-10">
                <div className="max-w-5xl mx-auto space-y-6 pb-12">
                    <div className="glass-panel p-8 rounded-xl border border-glass-border">
                        <div className="mb-8">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-gold/20 text-gold flex items-center justify-center text-xs font-bold border border-gold/30">1</span>
                                Pilih Periode Laporan
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <label className="relative cursor-pointer group">
                                    <input
                                        type="radio"
                                        name="period"
                                        className="sr-only"
                                        checked={period === 'daily'}
                                        onChange={() => setPeriod('daily')}
                                    />
                                    <div className={`glass-card p-5 rounded-xl h-full flex flex-col items-center justify-center text-center gap-3 relative overflow-hidden transition-all duration-300 ${period === 'daily' ? 'bg-[rgba(212,175,55,0.1)] border-[rgba(212,175,55,0.5)] shadow-[0_0_15px_rgba(212,175,55,0.1)]' : 'hover:bg-white/5 border-white/5'}`}>
                                        <div className={`absolute top-3 right-3 transition-all duration-300 text-gold ${period === 'daily' ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
                                            <span className="material-icons-round">check_circle</span>
                                        </div>
                                        <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mb-1 group-hover:bg-blue-500/20 transition-colors">
                                            <span className="material-icons-round text-2xl">today</span>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-white">Harian</h4>
                                            <p className="text-xs text-gray-400 mt-1">Laporan detail per hari ini atau tanggal tertentu</p>
                                        </div>
                                    </div>
                                </label>

                                <label className="relative cursor-pointer group">
                                    <input
                                        type="radio"
                                        name="period"
                                        className="sr-only"
                                        checked={period === 'weekly'}
                                        onChange={() => setPeriod('weekly')}
                                    />
                                    <div className={`glass-card p-5 rounded-xl h-full flex flex-col items-center justify-center text-center gap-3 relative overflow-hidden transition-all duration-300 ${period === 'weekly' ? 'bg-[rgba(212,175,55,0.1)] border-[rgba(212,175,55,0.5)] shadow-[0_0_15px_rgba(212,175,55,0.1)]' : 'hover:bg-white/5 border-white/5'}`}>
                                        <div className={`absolute top-3 right-3 transition-all duration-300 text-gold ${period === 'weekly' ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
                                            <span className="material-icons-round">check_circle</span>
                                        </div>
                                        <div className="w-12 h-12 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center mb-1 group-hover:bg-purple-500/20 transition-colors">
                                            <span className="material-icons-round text-2xl">date_range</span>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-white">Mingguan</h4>
                                            <p className="text-xs text-gray-400 mt-1">Rekapitulasi selama satu pekan</p>
                                        </div>
                                    </div>
                                </label>

                                <label className="relative cursor-pointer group">
                                    <input
                                        type="radio"
                                        name="period"
                                        className="sr-only"
                                        checked={period === 'monthly'}
                                        onChange={() => setPeriod('monthly')}
                                    />
                                    <div className={`glass-card p-5 rounded-xl h-full flex flex-col items-center justify-center text-center gap-3 relative overflow-hidden transition-all duration-300 ${period === 'monthly' ? 'bg-[rgba(212,175,55,0.1)] border-[rgba(212,175,55,0.5)] shadow-[0_0_15px_rgba(212,175,55,0.1)]' : 'hover:bg-white/5 border-white/5'}`}>
                                        <div className={`absolute top-3 right-3 transition-all duration-300 text-gold ${period === 'monthly' ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
                                            <span className="material-icons-round">check_circle</span>
                                        </div>
                                        <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-1 group-hover:bg-emerald-500/20 transition-colors">
                                            <span className="material-icons-round text-2xl">calendar_month</span>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-white">Bulanan</h4>
                                            <p className="text-xs text-gray-400 mt-1">Statistik lengkap selama satu bulan</p>
                                        </div>
                                    </div>
                                </label>
                            </div>

                            <div className="p-5 bg-black/20 rounded-xl border border-white/5">
                                <label className="block text-sm font-medium text-gray-400 mb-2">Rentang Tanggal</label>
                                <div className="flex flex-col md:flex-row items-center gap-4">
                                    <div className="relative w-full">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                            <span className="material-icons-round text-gray-500 text-sm">event</span>
                                        </div>
                                        <input
                                            type="date"
                                            className="bg-white/5 border border-white/10 text-white text-sm rounded-lg focus:ring-gold focus:border-gold block w-full pl-10 p-3 placeholder-gray-400 css-date-input"
                                            value={startDate}
                                            onChange={(e) => {
                                                setStartDate(e.target.value);
                                                setPeriod('custom');
                                            }}
                                        />
                                    </div>
                                    <span className="text-gray-500">s/d</span>
                                    <div className="relative w-full">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                            <span className="material-icons-round text-gray-500 text-sm">event</span>
                                        </div>
                                        <input
                                            type="date"
                                            className="bg-white/5 border border-white/10 text-white text-sm rounded-lg focus:ring-gold focus:border-gold block w-full pl-10 p-3 placeholder-gray-400 css-date-input"
                                            value={endDate}
                                            onChange={(e) => {
                                                setEndDate(e.target.value);
                                                setPeriod('custom');
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mb-8 pt-6 border-t border-white/5">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-gold/20 text-gold flex items-center justify-center text-xs font-bold border border-gold/30">2</span>
                                Format & Kategori
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-3">Format File</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <label className="cursor-pointer">
                                            <input
                                                type="radio"
                                                name="format"
                                                className="sr-only"
                                                checked={formatFile === 'pdf'}
                                                onChange={() => setFormatFile('pdf')}
                                            />
                                            <div className={`glass-card p-3 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors ${formatFile === 'pdf' ? 'bg-[rgba(212,175,55,0.1)] border-[rgba(212,175,55,0.5)] text-white' : 'text-gray-300 hover:text-white'}`}>
                                                <span className="material-icons-round text-red-400">picture_as_pdf</span>
                                                PDF Document
                                            </div>
                                        </label>
                                        <label className="cursor-pointer">
                                            <input
                                                type="radio"
                                                name="format"
                                                className="sr-only"
                                                checked={formatFile === 'excel'}
                                                onChange={() => setFormatFile('excel')}
                                            />
                                            <div className={`glass-card p-3 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors ${formatFile === 'excel' ? 'bg-[rgba(212,175,55,0.1)] border-[rgba(212,175,55,0.5)] text-white' : 'text-gray-300 hover:text-white'}`}>
                                                <span className="material-icons-round text-green-400">table_view</span>
                                                Excel (.csv)
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-3">Kategori User</label>
                                    <select
                                        className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-lg focus:ring-gold focus:border-gold block p-3"
                                        value={userCategory}
                                        onChange={(e) => setUserCategory(e.target.value)}
                                    >
                                        <option value="all">Semua Kategori (Santri, Staff, Pengurus)</option>
                                        <option value="santri">Hanya Santri</option>
                                        <option value="staff">Hanya Staff/Pengajar</option>
                                        <option value="admin">Hanya Pengurus</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mt-6">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 text-gold bg-black/40 border-gray-600 rounded focus:ring-gold focus:ring-2 focus:ring-offset-0"
                                        checked={includeLog}
                                        onChange={(e) => setIncludeLog(e.target.checked)}
                                    />
                                    <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Sertakan detail log (Log akan di-generate terpisah jika tersedia)</span>
                                </label>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-white/5 flex flex-col items-center">
                            <button
                                type="button"
                                onClick={handleExport}
                                disabled={isExporting}
                                className="group relative w-full md:w-2/3 flex items-center justify-center gap-3 bg-gradient-to-r from-gold via-[#eacda3] to-gold hover:from-[#eacda3] hover:to-[#d6ae7b] text-primary-dark font-bold py-4 px-8 rounded-xl shadow-lg shadow-gold/20 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                <span className={`material-icons-round text-xl group-hover:rotate-12 transition-transform duration-300 ${isExporting ? 'animate-spin' : ''}`}>
                                    {isExporting ? 'refresh' : 'download_for_offline'}
                                </span>
                                <span className="text-lg">{isExporting ? 'Sedang Memproses...' : 'Generate & Download Laporan'}</span>
                                {!isExporting && <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>}
                            </button>
                            <p className="mt-4 text-xs text-gray-500">Estimasi waktu proses: ~5-10 detik tergantung jumlah data.</p>
                        </div>
                    </div>

                    {/* Recent Downloads Mock (Static for now) */}
                    <div className="glass-panel rounded-xl border border-glass-border overflow-hidden opacity-50 pointer-events-none">
                        <div className="px-6 py-4 border-b border-glass-border bg-black/20 flex justify-between items-center">
                            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Riwayat Unduhan Terakhir (Mock)</h3>
                            <button className="text-xs text-gold hover:text-white transition-colors">Lihat Semua</button>
                        </div>
                        <div className="divide-y divide-white/5">
                            <div className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400 border border-green-500/20">
                                        <span className="material-icons-round">table_view</span>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-white">Data_Absensi_Minggu_3.csv</h4>
                                        <p className="text-xs text-gray-500">20 Jan 2024 • 09:15 • Oleh Admin Staff</p>
                                    </div>
                                </div>
                                <button className="p-2 text-gray-400 hover:text-gold transition-colors">
                                    <span className="material-icons-round">download</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <footer className="text-center text-xs text-gray-600 mt-8">
                        © 2024 Manah Tracking System. Developed for Pesantren Administration.
                    </footer>
                </div>
            </div>
        </div>
    );
};

export default ExportData;
