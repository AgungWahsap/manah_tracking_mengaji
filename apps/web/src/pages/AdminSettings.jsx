import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { attendanceService } from '../services/attendance.service';
import Header from '../components/Header';
import { useUserProfile } from '../hooks/useUser';
import { useSession } from '../hooks/useAuth';

const AdminSettings = () => {
    const navigate = useNavigate();
    const { toggleSidebar } = useOutletContext();
    const { data: session } = useSession();
    // Use useUserProfile as the source of truth for role to avoid session sync issues
    const { data: userProfile, isLoading: isProfileLoading } = useUserProfile();

    // Prefer userProfile, fallback to session user
    const user = userProfile || session?.user;

    const [prayerConfig, setPrayerConfig] = useState({
        subuh: { time: '04:30', offset: 20 },
        dzuhur: { time: '12:00', offset: 20 },
        ashar: { time: '15:15', offset: 20 },
        maghrib: { time: '18:00', offset: 20 },
        isya: { time: '19:15', offset: 20 }
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [resetting, setResetting] = useState(false);

    const [toggles, setToggles] = useState({
        bindDevice: false,
        geofencing: true,
        dynamicQr: true,
        selfie: false
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const response = await attendanceService.getPrayerTimes();
            if (response.success && response.data) {
                const newConfig = {};
                response.data.forEach(p => {
                    newConfig[p.name] = {
                        time: p.scheduledTime,
                        offset: p.offsetMinutes
                    };
                });
                setPrayerConfig(prev => ({ ...prev, ...newConfig }));
            }
        } catch (error) {
            console.error("Failed to fetch settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleConfigChange = (prayer, field, value) => {
        setPrayerConfig(prev => ({
            ...prev,
            [prayer]: {
                ...prev[prayer],
                [field]: field === 'offset' ? Number(value) : value
            }
        }));
    };

    const handleToggleChange = (setting) => {
        setToggles(prev => ({ ...prev, [setting]: !prev[setting] }));
    };

    const handleSaveSettings = async () => {
        setSaving(true);
        try {
            await attendanceService.updatePrayerTimes(prayerConfig);
            alert("✅ Pengaturan berhasil disimpan!");
        } catch (error) {
            console.error("Failed to save settings:", error);
            alert("❌ Gagal menyimpan pengaturan.");
        } finally {
            setSaving(false);
        }
    };

    const handleResetDaily = async () => {
        if (!confirm("⚠️ PERINGATAN: Apakah Anda yakin ingin menghapus SEMUA data absensi hari ini? Tindakan ini tidak dapat dibatalkan.")) {
            return;
        }
        setResetting(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            await attendanceService.resetDaily(today);
            alert("✅ Data absensi hari ini berhasil direset.");
        } catch (error) {
            console.error(error);
            alert("❌ Gagal mereset data: " + (error.response?.data?.error?.message || error.message));
        } finally {
            setResetting(false);
        }
    };

    return (
        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar z-10 px-8 pb-8 relative">
            {/* Background Pattern & Glow */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-primary/20 via-transparent to-transparent pointer-events-none z-0"></div>
            <div className="absolute -top-20 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none z-0"></div>

            <Header user={user} onMenuClick={toggleSidebar} />

            <div className="max-w-5xl mx-auto space-y-6">
                <div className="glass-panel p-6 rounded-xl border border-glass-border mb-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">Pengaturan Sistem</h2>
                        <div className="flex items-center gap-2 text-sm text-gray-400 mt-0.5">
                            <span className="material-icons-round text-gold text-sm">tune</span>
                            <span>Konfigurasi Aplikasi</span>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate(-1)}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg border border-white/10 text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <span className="material-icons-round text-sm">arrow_back</span>
                        Kembali
                    </button>
                </div>

                {/* Prayer Time Settings */}
                <div className="glass-panel rounded-xl overflow-hidden border border-glass-border">
                    <div className="p-6 border-b border-glass-border flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <span className="material-icons-round text-gold">schedule</span>
                                Pengaturan Waktu Shalat
                            </h3>
                            <p className="text-sm text-gray-400 mt-1">Atur waktu shalat dan offset (toleransi keterlambatan) untuk setiap waktu.</p>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-xs text-primary-light">Manual Configuration</span>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                        {['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'].map((prayer) => (
                            <div key={prayer} className="bg-black/20 p-4 rounded-lg border border-white/5 hover:border-gold/30 transition-colors">
                                <label className="block text-sm font-medium text-gray-300 mb-2 capitalize">{prayer}</label>
                                <div className="space-y-3">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs text-gray-500">Waktu</span>
                                        <input
                                            className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-center font-mono text-sm font-bold text-green-400 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all shadow-inner"
                                            type="time"
                                            value={prayerConfig[prayer]?.time || '00:00'}
                                            onChange={(e) => handleConfigChange(prayer, 'time', e.target.value)}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs text-gray-500">Offset (Menit)</span>
                                        <input
                                            className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-center font-mono text-sm text-gray-300 focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-all shadow-inner"
                                            type="number"
                                            value={prayerConfig[prayer]?.offset || 0}
                                            onChange={(e) => handleConfigChange(prayer, 'offset', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="px-6 pb-6 pt-2 flex items-center justify-end gap-3 border-t border-white/5">
                        <button
                            onClick={() => fetchSettings()}
                            disabled={loading || saving}
                            className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-sm"
                        >
                            Batal / Reset
                        </button>
                        <button
                            onClick={handleSaveSettings}
                            disabled={loading || saving}
                            className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-400 text-white font-bold text-sm shadow-lg shadow-green-500/20 transition-all transform hover:scale-105"
                        >
                            {saving ? 'Menyimpan...' : 'Simpan Waktu'}
                        </button>
                    </div>
                </div>

                {/* System & Security Settings */}
                <div className="glass-panel rounded-xl overflow-hidden border border-glass-border">
                    <div className="p-6 border-b border-glass-border">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <span className="material-icons-round text-gold">devices</span>
                            Sistem & Keamanan
                        </h3>
                        <p className="text-sm text-gray-400 mt-1">Pengaturan batasan perangkat dan metode absensi.</p>
                    </div>
                    <div className="divide-y divide-white/5">
                        {/* Toggles (Visual only for now as requested) */}
                        <div className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors">
                            <div className="flex-1 pr-8">
                                <h4 className="text-sm font-medium text-white mb-1">Bind Device (Kunci Perangkat)</h4>
                                <p className="text-xs text-gray-400">Jika aktif, santri hanya bisa absen menggunakan satu perangkat yang terdaftar pertama kali.</p>
                            </div>
                            <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                                <input
                                    type="checkbox"
                                    className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer border-gray-600 transition-all duration-300 checked:right-0 checked:border-gold"
                                    checked={toggles.bindDevice}
                                    onChange={() => handleToggleChange('bindDevice')}
                                />
                                <div className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${toggles.bindDevice ? 'bg-primary' : 'bg-gray-700'}`}></div>
                            </div>
                        </div>
                        {/* ... Reuse other toggles similarly or keep simple ... */}
                    </div>
                </div>

                {/* Dangerous Zone */}
                <div className="glass-panel rounded-xl overflow-hidden border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                    <div className="p-6 border-b border-white/5 bg-red-500/5">
                        <h3 className="text-lg font-semibold text-red-400 flex items-center gap-2">
                            <span className="material-icons-round">warning</span>
                            Zona Berbahaya (Reset Data)
                        </h3>
                        <p className="text-sm text-red-300/60 mt-1">Tindakan di sini tidak dapat dibatalkan. Harap berhati-hati.</p>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-lg border border-red-500/10 bg-red-500/5">
                            <div>
                                <h4 className="text-sm font-medium text-white">Reset Absensi Harian</h4>
                                <p className="text-xs text-gray-400 mt-1">Menghapus semua data absensi hari ini (berguna jika terjadi error sistem).</p>
                            </div>
                            <button
                                onClick={handleResetDaily}
                                disabled={resetting}
                                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                            >
                                {resetting ? 'Memproses...' : 'Reset Hari Ini'}
                            </button>
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-lg border border-red-500/10 bg-red-500/5 opacity-50 cursor-not-allowed">
                            <div>
                                <h4 className="text-sm font-medium text-white">Unbind Semua Perangkat</h4>
                                <p className="text-xs text-gray-400 mt-1">Fitur ini belum tersedia.</p>
                            </div>
                            <button disabled className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/30 rounded-lg text-sm font-medium cursor-not-allowed">
                                Unbind All
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sticky Footer Actions */}
                <div className="sticky bottom-4 glass-panel p-4 rounded-xl border border-glass-border flex items-center justify-between shadow-2xl backdrop-blur-xl z-30">
                    <div className="text-xs text-gray-400 ml-2">
                        Perubahan terakhir: <span className="text-white">Hari ini</span>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="px-6 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition-colors text-sm font-medium"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleSaveSettings}
                            disabled={saving}
                            className="px-6 py-2 rounded-lg bg-gold hover:bg-gold-light text-primary-dark font-bold text-sm shadow-lg shadow-gold/20 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </div>
                </div>
            </div>

            <footer className="mt-8 text-center text-xs text-gray-600 pb-4">
                © 2024 Manah Tracking System. Developed for Pesantren Administration.
            </footer>
        </div>
    );
};

export default AdminSettings;
