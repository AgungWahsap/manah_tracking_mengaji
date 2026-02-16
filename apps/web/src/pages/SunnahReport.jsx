import React, { useState, useEffect } from 'react';
import sunnahService from '../services/sunnah.service';
import { useOutletContext } from 'react-router-dom';
import { useSession } from '../hooks/useAuth';

const SunnahReport = () => {
    const { data: session } = useSession();
    const [report, setReport] = useState([]);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    const [activeFilter, setActiveFilter] = useState('today');

    useEffect(() => {
        loadReport();
    }, [startDate, endDate]);

    const loadReport = async () => {
        setLoading(true);
        try {
            const response = await sunnahService.getReport({ startDate, endDate, role: 'Semua Status' });
            if (response.success) {
                setReport(response.data);
            }
        } catch (error) {
            console.error("Failed to load report", error);
        } finally {
            setLoading(false);
        }
    };

    const practices = [
        { id: 'tahajud', label: 'Tahajud', short: 'THJ' },
        { id: 'dhuha', label: 'Dhuha', short: 'DHA' },
        { id: 'witir', label: 'Witir', short: 'WTR' },
        { id: 'qobliyah_subuh', label: 'Qobliyah Subuh', short: 'Q.SBH' },
        { id: 'qobliyah_dzuhur', label: 'Qobliyah Dzuhur', short: 'Q.DZH' },
        { id: 'badiyah_dzuhur', label: 'Ba\'diyah Dzuhur', short: 'B.DZH' },
        { id: 'qobliyah_ashar', label: 'Qobliyah Ashar', short: 'Q.ASH' },
        { id: 'qobliyah_maghrib', label: 'Qobliyah Maghrib', short: 'Q.MGB' },
        { id: 'badiyah_maghrib', label: 'Ba\'diyah Maghrib', short: 'B.MGB' },
        { id: 'qobliyah_isya', label: 'Qobliyah Isya', short: 'Q.ISY' },
        { id: 'badiyah_isya', label: 'Ba\'diyah Isya', short: 'B.ISY' }
    ];

    const handleFilter = (type) => {
        setActiveFilter(type);
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const todayStr = `${yyyy}-${mm}-${dd}`;

        if (type === 'today') {
            setStartDate(todayStr);
            setEndDate(todayStr);
        } else if (type === 'week') {
            // Monday of this week
            const day = today.getDay(); // 0 (Sun) - 6 (Sat)
            const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
            const monday = new Date(today.setDate(diff));
            const monYYYY = monday.getFullYear();
            const monMM = String(monday.getMonth() + 1).padStart(2, '0');
            const monDD = String(monday.getDate()).padStart(2, '0');
            setStartDate(`${monYYYY}-${monMM}-${monDD}`);
            setEndDate(todayStr); // Until today
        } else if (type === 'month') {
            setStartDate(`${yyyy}-${mm}-01`);
            setEndDate(todayStr);
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
                        <h2 className="text-2xl font-bold text-white tracking-tight">Laporan Amalan</h2>
                        <div className="flex items-center gap-2 text-sm text-gray-400 mt-0.5">
                            <span className="material-icons-round text-gold text-sm">nights_stay</span>
                            <span>Pemantauan Ibadah Puasa</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={loadReport} className="p-2 rounded-lg bg-black/20 text-gray-400 hover:text-gold hover:bg-black/30 transition-all" title="Refresh Data">
                        <span className="material-icons-round">refresh</span>
                    </button>
                </div>
            </header>

            <div className="flex-1 p-4 overflow-hidden flex flex-col z-10">
                <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
                    <div className="p-4 md:p-8">
                        <div className="glass-panel p-6 rounded-2xl mb-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                                <h2 className="text-xl font-bold text-white">Filter Laporan</h2>
                                <div className="flex bg-black/20 p-1 rounded-lg border border-white/5">
                                    {['today', 'week', 'month'].map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => handleFilter(type)}
                                            className={`px-4 py-2 text-xs font-semibold rounded-md transition-all duration-300 ${activeFilter === type
                                                ? 'bg-gold text-primary-dark shadow-[0_0_10px_rgba(255,215,0,0.3)] transform scale-105'
                                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                                }`}
                                        >
                                            {type === 'today' ? 'Hari Ini' : type === 'week' ? 'Minggu Ini' : 'Bulan Ini'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-4 mb-4 flex-wrap">
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={e => setStartDate(e.target.value)}
                                    className="bg-black/20 border border-white/10 rounded px-3 py-2 text-white text-sm"
                                />
                                <span className="text-gray-400 self-center text-sm">s/d</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={e => setEndDate(e.target.value)}
                                    className="bg-black/20 border border-white/10 rounded px-3 py-2 text-white text-sm"
                                />
                                <button onClick={loadReport} className="btn-primary text-sm px-4 py-2">Filter</button>
                            </div>
                        </div>

                        <div className="glass-panel p-4 rounded-2xl overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/10 text-gray-400 text-xs">
                                        <th className="p-2 whitespace-nowrap sticky left-0 bg-[#1e1e1e] z-10 shadow-lg">Nama Santri</th>
                                        {practices.map(p => (
                                            <th key={p.id} className="p-2 text-center" title={p.label}>
                                                {p.short}
                                            </th>
                                        ))}
                                        <th className="p-2 text-center whitespace-nowrap">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="text-white text-xs">
                                    {loading ? (
                                        <tr><td colSpan={15} className="p-4 text-center">Memuat...</td></tr>
                                    ) : report.length === 0 ? (
                                        <tr><td colSpan={15} className="p-4 text-center">Tidak ada data</td></tr>
                                    ) : (
                                        report.map((row, idx) => (
                                            <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                <td className="p-2 font-medium whitespace-nowrap sticky left-0 bg-[#1e1e1e] z-10 border-r border-white/5">
                                                    {row.user.name}
                                                    <div className="text-[10px] text-gray-500 truncate max-w-[120px]">{row.user.nis}</div>
                                                </td>
                                                {practices.map(p => (
                                                    <td key={p.id} className="p-2 text-center">
                                                        {row.stats[p.id] ? (
                                                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500/20 text-green-400 font-bold">
                                                                {row.stats[p.id]}
                                                            </span>
                                                        ) : '-'}
                                                    </td>
                                                ))}
                                                <td className="p-2 text-center font-bold text-accent-gold">
                                                    {Object.values(row.stats).reduce((a, b) => a + b, 0)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SunnahReport;
