import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { attendanceService } from '../services/attendance.service';
import Header from '../components/Header';
import { useUserProfile } from '../hooks/useUser';
import { useSession } from '../hooks/useAuth';

const AdminBulkAttendance = () => {
    const navigate = useNavigate();
    const { toggleSidebar } = useOutletContext();
    const { data: session } = useSession();
    const { data: userProfile } = useUserProfile();
    const user = userProfile || session?.user;

    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [prayerTimes, setPrayerTimes] = useState([]);
    const [selectedPrayerId, setSelectedPrayerId] = useState('');
    const [users, setUsers] = useState([]);
    const [selectedUserIds, setSelectedUserIds] = useState(new Set());
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [filterName, setFilterName] = useState('');

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            // Load Prayer Times
            const prayerRes = await attendanceService.getPrayerTimes();
            if (prayerRes.success && prayerRes.data) {
                setPrayerTimes(prayerRes.data);
                // Default to first prayer or current?
                if (prayerRes.data.length > 0) {
                    setSelectedPrayerId(prayerRes.data[0].id);
                }
            }

            // Load Users (Using Global Recap for now to get list, or we need a proper getUsers endpoint?)
            // Global Recap returns paginated data. We might need a "getAllUsers" or just fetch a large limit.
            // Let's try fetching global recap for today with large limit.
            const userRes = await attendanceService.getGlobalRecap({ page: 1, limit: 1000, date });
            if (userRes.success && userRes.data) {
                // Extract unique users from the recap data
                const userList = userRes.data.map(item => item.user);
                setUsers(userList);
            }
        } catch (error) {
            console.error("Failed to load data:", error);
            alert("Gagal memuat data awal.");
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAll = () => {
        if (selectedUserIds.size === filteredUsers.length) {
            setSelectedUserIds(new Set());
        } else {
            const newSet = new Set(filteredUsers.map(u => u.id));
            setSelectedUserIds(newSet);
        }
    };

    const handleUserToggle = (userId) => {
        const newSet = new Set(selectedUserIds);
        if (newSet.has(userId)) {
            newSet.delete(userId);
        } else {
            newSet.add(userId);
        }
        setSelectedUserIds(newSet);
    };

    const handleSubmit = async () => {
        if (!selectedPrayerId) {
            alert("Pilih waktu shalat terlebih dahulu.");
            return;
        }
        if (selectedUserIds.size === 0) {
            alert("Pilih setidaknya satu santri.");
            return;
        }

        if (!confirm(`Absenkan ${selectedUserIds.size} santri untuk shalat ini?`)) return;

        setSubmitting(true);
        try {
            const userIds = Array.from(selectedUserIds);
            const response = await attendanceService.bulkCheckIn({
                prayerTimeId: selectedPrayerId,
                userIds,
                date,
                status: 'present'
            });

            if (response.success) {
                alert(`✅ Berhasil memproses ${response.message}`);
                setSelectedUserIds(new Set());
                // Optionally reload data?
            }
        } catch (error) {
            console.error("Bulk check-in failed:", error);
            alert(`❌ Gagal: ${error.response?.data?.error?.message || error.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    const filteredUsers = useMemo(() => {
        return users.filter(u => u.name.toLowerCase().includes(filterName.toLowerCase()));
    }, [users, filterName]);

    return (
        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar z-10 px-8 pb-8 relative">
            {/* Background */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-primary/20 via-transparent to-transparent pointer-events-none z-0"></div>

            <Header user={user} onMenuClick={toggleSidebar} />

            <div className="max-w-5xl mx-auto space-y-6 relative z-10">
                <div className="glass-panel p-6 rounded-xl border border-glass-border mb-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">Absensi Massal (Admin Mode)</h2>
                        <p className="text-sm text-gray-400 mt-1">Input kehadiran santri secara kolektif untuk waktu Subuh, Maghrib, Isya.</p>
                    </div>
                    <button
                        onClick={() => navigate(-1)}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg border border-white/10 text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <span className="material-icons-round text-sm">arrow_back</span>
                        Kembali
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Controls Panel */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="glass-panel p-6 rounded-xl border border-glass-border space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Tanggal</label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-accent-gold outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Waktu Shalat</label>
                                <div className="space-y-2">
                                    {prayerTimes.map((prayer) => (
                                        <label
                                            key={prayer.id}
                                            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${selectedPrayerId === prayer.id
                                                    ? 'bg-accent-gold/20 border-accent-gold text-white'
                                                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="radio"
                                                    name="prayerTime"
                                                    value={prayer.id}
                                                    checked={selectedPrayerId === prayer.id}
                                                    onChange={() => setSelectedPrayerId(prayer.id)}
                                                    className="w-4 h-4 text-accent-gold focus:ring-accent-gold bg-transparent border-gray-500"
                                                />
                                                <span className="capitalize font-medium">{prayer.name}</span>
                                            </div>
                                            <span className="text-xs font-mono">{prayer.scheduledTime}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={submitting || loading}
                                className="w-full py-3 rounded-lg bg-green-600 hover:bg-green-500 text-white font-bold shadow-lg shadow-green-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? 'Memproses...' : 'Submit Absensi'}
                                <span className="material-icons-round">check_circle</span>
                            </button>
                        </div>
                    </div>

                    {/* User List Panel */}
                    <div className="lg:col-span-2 glass-panel p-6 rounded-xl border border-glass-border flex flex-col h-[600px]">
                        <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4">
                            <h3 className="text-lg font-semibold text-white">Daftar Santri ({filteredUsers.length})</h3>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    placeholder="Cari nama..."
                                    value={filterName}
                                    onChange={(e) => setFilterName(e.target.value)}
                                    className="bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-accent-gold outline-none w-48"
                                />
                                <button
                                    onClick={handleSelectAll}
                                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-xs text-white rounded-lg transition-colors"
                                >
                                    {selectedUserIds.size === filteredUsers.length && filteredUsers.length > 0 ? 'Deselect All' : 'Select All'}
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-2">
                            {loading ? (
                                <div className="text-center py-10 text-gray-500">Memuat data santri...</div>
                            ) : filteredUsers.length === 0 ? (
                                <div className="text-center py-10 text-gray-500">Tidak ada santri ditemukan.</div>
                            ) : (
                                filteredUsers.map((u) => (
                                    <label
                                        key={u.id}
                                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${selectedUserIds.has(u.id)
                                                ? 'bg-primary/20 border-primary/50'
                                                : 'bg-transparent border-transparent hover:bg-white/5'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedUserIds.has(u.id)}
                                                    onChange={() => handleUserToggle(u.id)}
                                                    className="peer sr-only"
                                                />
                                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedUserIds.has(u.id) ? 'bg-primary border-primary' : 'border-gray-500'
                                                    }`}>
                                                    {selectedUserIds.has(u.id) && <span className="material-icons-round text-xs text-white">check</span>}
                                                </div>
                                            </div>
                                            <div>
                                                <p className={`font-medium ${selectedUserIds.has(u.id) ? 'text-white' : 'text-gray-300'}`}>
                                                    {u.name}
                                                </p>
                                                <p className="text-xs text-gray-500">{u.nis || 'No NIS'}</p>
                                            </div>
                                        </div>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                                            }`}>
                                            {u.role}
                                        </span>
                                    </label>
                                ))
                            )}
                        </div>

                        <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-sm text-gray-400">
                            <span>Terpilih: <span className="text-white font-bold">{selectedUserIds.size}</span> santri</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminBulkAttendance;
