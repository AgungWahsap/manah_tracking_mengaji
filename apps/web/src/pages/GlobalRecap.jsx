import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import HeaderAdmin from '../components/HeaderAdmin';
import { recitationService } from '../services/recitation.service';

const getJakartaDate = () => {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Jakarta',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    return `${values.year}-${values.month}-${values.day}`;
};

const STATUS_LABELS = { H: 'Hadir', S: 'Sakit', I: 'Izin', A: 'Alfa' };

const escapeCsv = (value) => {
    const text = String(value ?? '');
    const safeText = /^[=+\-@]/.test(text) ? `'${text}` : text;
    return `"${safeText.replaceAll('"', '""')}"`;
};

const GlobalRecap = () => {
    const { toggleSidebar } = useOutletContext();
    const today = getJakartaDate();
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);
    const [sessions, setSessions] = useState([]);
    const [sessionId, setSessionId] = useState('');
    const [records, setRecords] = useState([]);
    const [totals, setTotals] = useState({ H: 0, S: 0, I: 0, A: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        recitationService.getSessions()
            .then((response) => setSessions(response.data || []))
            .catch((loadError) => setError(loadError.message || 'Gagal memuat jadwal sesi.'));
    }, []);

    useEffect(() => {
        if (!startDate || !endDate) return;
        let cancelled = false;
        const loadRecap = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await recitationService.getRecap({
                    startDate,
                    endDate,
                    ...(sessionId ? { sessionId } : {}),
                });
                if (!cancelled) {
                    setRecords(response.data || []);
                    setTotals(response.totals || { H: 0, S: 0, I: 0, A: 0 });
                }
            } catch (loadError) {
                if (!cancelled) setError(loadError.message || 'Gagal memuat rekap.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        loadRecap();
        return () => { cancelled = true; };
    }, [startDate, endDate, sessionId]);

    const handleExport = () => {
        const rows = [
            ['Tanggal', 'Waktu Mengaji', 'Nama Santri', 'NIS', 'Status'],
            ...records.map((record) => [
                record.date,
                record.sessionName,
                record.studentName,
                record.nis || '',
                STATUS_LABELS[record.status] || record.status,
            ]),
        ];
        const csv = `\uFEFF${rows.map((row) => row.map(escapeCsv).join(',')).join('\r\n')}`;
        const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = `rekap-mengaji-${startDate}-${endDate}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-4 pb-8 md:px-8">
            <HeaderAdmin onMenuClick={toggleSidebar} title="Rekap Absensi Mengaji" />
            <main className="mx-auto max-w-7xl space-y-6 py-6">
                <section className="glass-panel rounded-xl border border-glass-border p-6">
                    <div className="flex flex-wrap items-end gap-4">
                        <label className="text-sm text-gray-300">
                            Dari tanggal
                            <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="mt-2 block rounded-lg border border-white/10 bg-black/30 p-3 text-white" />
                        </label>
                        <label className="text-sm text-gray-300">
                            Sampai tanggal
                            <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="mt-2 block rounded-lg border border-white/10 bg-black/30 p-3 text-white" />
                        </label>
                        <label className="text-sm text-gray-300">
                            Waktu Mengaji
                            <select value={sessionId} onChange={(event) => setSessionId(event.target.value)} className="mt-2 block min-w-44 rounded-lg border border-white/10 bg-black/30 p-3 text-white">
                                <option value="">Semua waktu</option>
                                {sessions.map((session) => <option key={session.id} value={session.id}>{session.name[0].toUpperCase() + session.name.slice(1)}</option>)}
                            </select>
                        </label>
                        <button
                            type="button"
                            onClick={handleExport}
                            disabled={records.length === 0}
                            className="rounded-lg border border-white/10 px-4 py-3 text-sm font-medium text-gray-200 hover:bg-white/5 disabled:opacity-40"
                        >
                            Unduh CSV
                        </button>
                    </div>
                </section>

                <section className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                    {Object.entries(STATUS_LABELS).map(([code, label]) => (
                        <div key={code} className="glass-panel rounded-xl border border-glass-border p-5">
                            <p className="text-sm text-gray-400">{label}</p>
                            <p className="mt-2 text-3xl font-bold text-white">{totals[code] || 0}</p>
                        </div>
                    ))}
                </section>

                {error && <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-300">{error}</div>}
                <section className="glass-panel overflow-hidden rounded-xl border border-glass-border">
                    {loading ? (
                        <div className="p-10 text-center text-gray-400">Memuat rekap...</div>
                    ) : records.length === 0 ? (
                        <div className="p-10 text-center text-gray-400">Belum ada absensi tersimpan pada periode ini.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[700px] text-left">
                                <thead className="bg-white/5 text-xs uppercase text-gray-400">
                                    <tr>
                                        <th className="p-4">Tanggal</th>
                                        <th className="p-4">Waktu</th>
                                        <th className="p-4">Nama Santri</th>
                                        <th className="p-4">NIS</th>
                                        <th className="p-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {records.map((record) => (
                                        <tr key={record.id} className="hover:bg-white/[0.03]">
                                            <td className="p-4 text-gray-300">{record.date}</td>
                                            <td className="p-4 capitalize text-gray-300">{record.sessionName} <span className="text-gray-500">{record.scheduledTime.slice(0, 5)}</span></td>
                                            <td className="p-4 font-medium text-white">{record.studentName}</td>
                                            <td className="p-4 text-gray-400">{record.nis || '—'}</td>
                                            <td className="p-4">
                                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    record.status === 'H' ? 'bg-green-500/10 text-green-300'
                                                        : record.status === 'S' ? 'bg-yellow-500/10 text-yellow-300'
                                                            : record.status === 'I' ? 'bg-blue-500/10 text-blue-300'
                                                                : 'bg-red-500/10 text-red-300'
                                                }`}>
                                                    {record.status} — {STATUS_LABELS[record.status]}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default GlobalRecap;
