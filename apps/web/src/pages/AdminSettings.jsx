import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import HeaderAdmin from '../components/HeaderAdmin';
import { recitationService } from '../services/recitation.service';

const SESSION_NAMES = ['subuh', 'dzuhur', 'ashar', 'isya'];

const AdminSettings = () => {
    const { toggleSidebar } = useOutletContext();
    const [times, setTimes] = useState({ subuh: '04:30', dzuhur: '12:00', ashar: '15:30', isya: '19:30' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    useEffect(() => {
        const loadSessions = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await recitationService.getSessions();
                setTimes((current) => {
                    const next = { ...current };
                    (response.data || []).forEach((session) => {
                        if (SESSION_NAMES.includes(session.name)) next[session.name] = session.scheduledTime.slice(0, 5);
                    });
                    return next;
                });
            } catch (loadError) {
                setError(loadError.message || 'Gagal memuat jadwal mengaji.');
            } finally {
                setLoading(false);
            }
        };
        loadSessions();
    }, []);

    const handleSave = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError('');
        setNotice('');
        try {
            await recitationService.updateSessions(times);
            setNotice('Jadwal waktu mengaji berhasil disimpan.');
        } catch (saveError) {
            setError(saveError.message || 'Gagal menyimpan jadwal.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-4 pb-8 md:px-8">
            <HeaderAdmin onMenuClick={toggleSidebar} />
            <main className="mx-auto max-w-5xl space-y-6 py-6">
                <section className="glass-panel rounded-xl border border-glass-border p-6">
                    <h1 className="text-2xl font-bold text-white">Waktu Mengaji</h1>
                    <p className="mt-1 text-sm text-gray-400">Atur jadwal empat sesi mengaji. Jadwal ini ditampilkan pada halaman absensi admin.</p>
                    {error && <div role="alert" className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-300">{error}</div>}
                    {notice && <div role="status" className="mt-5 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-green-300">{notice}</div>}
                    <form onSubmit={handleSave} className="mt-6">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {SESSION_NAMES.map((name) => (
                                <label key={name} className="rounded-lg border border-white/10 bg-black/20 p-4 text-sm font-medium capitalize text-gray-300">
                                    {name}
                                    <input
                                        required
                                        type="time"
                                        value={times[name]}
                                        onChange={(event) => setTimes((current) => ({ ...current, [name]: event.target.value }))}
                                        className="mt-3 block w-full rounded-lg border border-white/10 bg-black/40 p-3 text-center font-mono text-lg text-white"
                                    />
                                </label>
                            ))}
                        </div>
                        <div className="mt-6 flex justify-end border-t border-white/10 pt-5">
                            <button
                                type="submit"
                                disabled={loading || saving}
                                className="rounded-lg bg-green-600 px-5 py-2.5 font-semibold text-white hover:bg-green-500 disabled:opacity-50"
                            >
                                {saving ? 'Menyimpan...' : 'Simpan Jadwal'}
                            </button>
                        </div>
                    </form>
                </section>
            </main>
        </div>
    );
};

export default AdminSettings;
