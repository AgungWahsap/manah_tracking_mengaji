import React, { useState, useEffect } from 'react';
import { attendanceService } from '../services/attendance.service';

const HeroSection = () => {
    const [prayerTimes, setPrayerTimes] = useState([]);
    const [nextPrayer, setNextPrayer] = useState(null);
    const [activePrayer, setActivePrayer] = useState(null);
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState('');
    const [isPermitModalOpen, setIsPermitModalOpen] = useState(false);
    const [permitType, setPermitType] = useState('sick'); // sick, permission
    const [permitReason, setPermitReason] = useState('');
    const [isSubmittingPermit, setIsSubmittingPermit] = useState(false);
    const [todayStatus, setTodayStatus] = useState({}); // { [prayerId]: { status: 'present'|'excused'|'none' } }

    useEffect(() => {
        loadPrayerTimes();
        checkTodayStatus();
    }, []);

    const checkTodayStatus = async () => {
        try {
            const response = await attendanceService.getTodayStatus();

            if (response.success && response.data) {
                const statusMap = {};

                // Process Attendance Records
                if (response.data.records) {
                    response.data.records.forEach(r => {
                        if (r.prayerTimeId) {
                            statusMap[r.prayerTimeId] = { type: 'attendance', status: r.status, source: r.source };
                        }
                    });
                }

                // Process Permits
                if (response.data.permits) {
                    response.data.permits.forEach(p => {
                        if (p.prayerTimeId) {
                            statusMap[p.prayerTimeId] = { type: 'permit', status: 'excused' };
                        } else if (p.isFullDay) {
                            statusMap['full_day'] = { type: 'permit', status: 'excused' };
                        }
                    });
                }

                setTodayStatus(statusMap);
            }
        } catch (error) {
            console.error("Failed to check status", error);
        }
    };

    // Derived state for current/next prayer status
    const getButtonState = () => {
        // Target prayer is Active Prayer (if entered) or Next Prayer (if early)
        // But usually actions are for the *Active* prayer.
        // If no active prayer (e.g. 02:00 AM), buttons should probably target Next Prayer (Subuh)?
        // User wants "Absensi 5 waktu".
        const target = activePrayer || nextPrayer;
        if (!target) return { disabled: true, text: 'LOADING...' };

        // Check full day permit
        if (todayStatus['full_day']) {
            return { disabled: true, text: 'IZIN SEHARIAN' };
        }

        const status = todayStatus[target.id];
        if (status) {
            if (status.type === 'attendance') {
                if (status.source === 'ADMIN') {
                    return { disabled: true, text: `SUDAH ABSEN (ADMIN)` };
                }
                return { disabled: true, text: `SUDAH HADIR (${target.name.toUpperCase()})` };
            }
            if (status.type === 'permit') {
                return { disabled: true, text: `SUDAH IJIN (${target.name.toUpperCase()})` };
            }
        }

        return { disabled: false, text: null, targetName: target.name };
    };

    const buttonState = getButtonState();

    useEffect(() => {
        loadPrayerTimes();
    }, []);

    useEffect(() => {
        if (prayerTimes.length > 0) {
            // Update active/next prayer periodically in case time crosses boundary
            const timer = setInterval(() => {
                determinePrayers(prayerTimes);
                updateCountdown();
            }, 1000); // Check every second? Or minute?
            return () => clearInterval(timer);
        }
    }, [prayerTimes, nextPrayer]); // Update when prayerTimes loaded

    const loadPrayerTimes = async () => {
        try {
            const response = await attendanceService.getPrayerTimes();
            if (response.success && response.data) {
                setPrayerTimes(response.data);
                determinePrayers(response.data);
            }
        } catch (error) {
            console.error('Failed to load prayer times:', error);
        }
    };

    const determinePrayers = (times) => {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();

        // 1. Find Next Prayer
        let upcoming = null;
        for (const pt of times) {
            const [hours, minutes] = pt.scheduledTime.split(':').map(Number);
            const ptTime = hours * 60 + minutes;
            if (ptTime > currentTime) {
                upcoming = pt;
                break;
            }
        }
        if (!upcoming && times.length > 0) {
            upcoming = times[0]; // Tomorrow Subuh
        }
        setNextPrayer(upcoming);

        // 2. Find Active Prayer (Most recent passed)
        let active = null;
        for (let i = times.length - 1; i >= 0; i--) {
            const pt = times[i];
            const [h, m] = pt.scheduledTime.split(':').map(Number);
            const ptMinutes = h * 60 + m;

            if (currentTime >= ptMinutes) {
                active = pt;
                break;
            }
        }
        setActivePrayer(active);
    };

    const updateCountdown = () => {
        if (!nextPrayer) return;

        const now = new Date();
        const [hours, minutes] = nextPrayer.scheduledTime.split(':').map(Number);

        let target = new Date();
        target.setHours(hours, minutes, 0, 0);

        if (target < now) {
            target.setDate(target.getDate() + 1);
        }

        const diff = target - now;

        if (diff <= 0) {
            setCountdown('00:00:00');
            return;
        }

        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);

        setCountdown(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    };

    const handleCheckIn = async () => {
        if (!activePrayer && prayerTimes.length === 0) {
            alert('Data jadwal sholat belum dimuat.');
            return;
        }

        if (!activePrayer) {
            alert("Belum masuk waktu sholat.");
            return;
        }

        // Extra check: If status already exists (Double protection)
        const status = todayStatus[activePrayer.id];
        if (status) {
            if (status.type === 'attendance') {
                alert("Anda sudah melakukan absensi untuk waktu ini.");
                return;
            }
            if (status.type === 'permit') {
                alert("Anda sudah mengajukan ijin untuk waktu ini.");
                return;
            }
        }

        if (buttonState.disabled) {
            return;
        }

        if (confirm(`Check-in untuk sholat ${activePrayer.name.toUpperCase()}?`)) {
            setLoading(true);
            try {
                const checkInData = {
                    prayerTimeId: activePrayer.id,
                    location: 'Kantor Admin',
                    method: 'manual',
                    latitude: 0,
                    longitude: 0
                };

                await attendanceService.checkIn(checkInData);
                alert(`✅ Berhasil Check-in untuk ${activePrayer.name.toUpperCase()}!`);
                checkTodayStatus();
            } catch (error) {
                console.error(error);
                alert(`❌ Gagal Check-in: ${error.response?.data?.error?.message || error.message}`);
            } finally {
                setLoading(false);
            }
        }
    };

    const handlePermitSubmit = async (e) => {
        e.preventDefault();
        if (!permitReason.trim()) {
            alert("Mohon isi alasan ijin/sakit/khidmat.");
            return;
        }

        // Fix: Use activePrayer if available (current time), otherwise nextPrayer (upcoming)
        // This prevents Ijin from being assigned to the WRONG (next) time when the current time is valid.
        const targetPrayer = activePrayer || nextPrayer;

        if (!targetPrayer) {
            alert("Tidak ada jadwal sholat aktif untuk ijin.");
            return;
        }

        setIsSubmittingPermit(true);
        try {
            // Map UI "khidmat" to backend type "permission" (or keep as is if schema allows, but schema has sick, permission, other)
            // User requested: "Sakit" and "Khidmat".
            // We'll map "Khidmat" to 'permission' (Ijin) or 'other' with text 'Khidmat' embedded?
            // Or use type='other' and reason "Khidmat: ..."?

            // Let's use:
            // Sakit -> sick
            // Khidmat -> permission (as in "Ijin Khidmat")

            const type = permitType === 'khidmat' ? 'permission' : permitType;
            const finalReason = permitType === 'khidmat' ? `[Khidmat] ${permitReason}` : permitReason;

            // Sakit usually means full day? User said "ijin itu mencakup sakit dan khidmat. saat user memilih ijin, ijinya di 1 waktu aja"
            // So EVEN SICK is single time? That's unusual but I will follow: "ijinya di 1 waktu aja".
            // I will default isFullDay to FALSE for everything, passing prayerTimeId.
            // UNLESS user explicitly toggles "Seharian"? (Not requested, so sticking to single time).

            await attendanceService.submitPermit({
                date: new Date().toISOString().split('T')[0],
                type: type,
                reason: finalReason,
                isFullDay: false, // Force single time
                prayerTimeId: targetPrayer.id
            });

            alert("✅ Pengajuan Ijin berhasil dikirim.");
            setIsPermitModalOpen(false);
            setPermitReason('');
            setPermitType('sick');
            loadPrayerTimes(); // Reload to update button states
            checkTodayStatus();
        } catch (error) {
            console.error(error);
            alert(`❌ Gagal mengirim ijin: ${error.response?.data?.error?.message || error.message}`);
        } finally {
            setIsSubmittingPermit(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
            {/* Prayer Time Card */}
            <div className="lg:col-span-7 glass-panel rounded-2xl p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3 group-hover:bg-primary/30 transition-all duration-700"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between h-full">
                    <div className="flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-2 text-accent-gold mb-2">
                                <span className="material-icons-round text-sm">schedule</span>
                                <span className="text-xs font-semibold uppercase tracking-wider">Jadwal Sholat Berikutnya</span>
                            </div>
                            <h3 className="text-4xl font-bold text-white mb-1 uppercase">{nextPrayer ? nextPrayer.name : 'Loading...'}</h3>
                            <p className="text-gray-400 text-lg">{nextPrayer ? nextPrayer.scheduledTime : '--:--'} WIB</p>
                        </div>
                        <div className="mt-8 md:mt-0">
                            <p className="text-sm text-gray-400 mb-1">Menuju Adzan</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-mono font-medium text-white">{countdown || '00:00:00'}</span>
                                <span className="text-xs text-gray-500">JAM MENIT DETIK</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 md:mt-0 md:ml-6 flex-1 flex flex-col justify-center">
                        {/* Prayer Times List */}
                        <div className="space-y-2">
                            {prayerTimes.length > 0 ? (
                                prayerTimes.map((prayer) => {
                                    const isActive = activePrayer && activePrayer.id === prayer.id;
                                    const isNext = nextPrayer && nextPrayer.id === prayer.id;

                                    return (
                                        <div
                                            key={prayer.id}
                                            className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all ${isActive
                                                    ? 'bg-gradient-to-r from-accent-gold/20 to-transparent border-l-2 border-accent-gold'
                                                    : isNext
                                                        ? 'bg-white/10 border-l-2 border-white/50'
                                                        : 'hover:bg-white/5 border-l-2 border-transparent'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className={`material-icons-round text-sm ${isActive || isNext ? 'text-accent-gold' : 'text-gray-500'}`}>
                                                    {prayer.name.toLowerCase().includes('subuh') ? 'wb_twilight' :
                                                        prayer.name.toLowerCase().includes('dzuhur') || prayer.name.toLowerCase().includes('zuhur') ? 'wb_sunny' :
                                                            prayer.name.toLowerCase().includes('ashar') ? 'wb_cloudy' :
                                                                prayer.name.toLowerCase().includes('maghrib') ? 'routine' :
                                                                    'nights_stay'}
                                                </span>
                                                <span className={`text-sm font-medium ${isActive || isNext ? 'text-white' : 'text-gray-400'}`}>
                                                    {prayer.name}
                                                </span>
                                            </div>
                                            <span className={`text-sm font-mono ${isActive || isNext ? 'text-white font-bold' : 'text-gray-500'}`}>
                                                {prayer.scheduledTime?.substring(0, 5)}
                                            </span>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center text-gray-400 text-sm py-4">
                                    <span className="material-icons-round animate-spin mb-2">sync</span>
                                    <p>Memuat jadwal...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions Card */}
            <div className="lg:col-span-5 flex flex-col gap-4">
                <div className="glass-panel rounded-2xl p-6 flex-1 flex flex-col justify-center">
                    <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                        <span className="w-1 h-6 bg-accent-gold rounded-full"></span>
                        Absensi Cepat
                    </h3>
                    <div className="grid grid-cols-2 gap-4 h-full">
                        <button
                            disabled={loading || buttonState.disabled}
                            onClick={handleCheckIn}
                            className={`group relative overflow-hidden rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all duration-300 ${buttonState.disabled
                                ? 'bg-gray-500/20 border border-gray-500/30 cursor-not-allowed opacity-50'
                                : 'bg-gradient-to-br from-green-600 to-primary hover:shadow-lg hover:shadow-green-900/40 border border-green-500/20'
                                }`}
                        >
                            {/* Overlay for hover effect only if not disabled */}
                            {!buttonState.disabled && <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors"></div>}

                            <span className={`material-icons-round text-4xl transition-transform ${buttonState.disabled ? 'text-gray-400' : 'text-white group-hover:scale-110'}`}>fingerprint</span>
                            <span className={`font-bold tracking-wide ${buttonState.disabled ? 'text-gray-400' : 'text-white'}`}>
                                {loading ? 'PROSES...' : (buttonState.text && buttonState.text.includes('HADIR') ? buttonState.text : 'HADIR')}
                            </span>
                        </button>
                        <button
                            disabled={buttonState.disabled}
                            onClick={() => setIsPermitModalOpen(true)}
                            className={`group relative overflow-hidden rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all duration-300 ${buttonState.disabled
                                ? 'bg-gray-500/20 border border-gray-500/30 cursor-not-allowed opacity-50'
                                : 'bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 border border-yellow-500/30 hover:bg-yellow-600/30'
                                }`}
                        >
                            <span className={`material-icons-round text-4xl transition-transform ${buttonState.disabled ? 'text-gray-400' : 'text-accent-gold group-hover:scale-110'}`}>assignment_late</span>
                            <span className={`font-bold tracking-wide ${buttonState.disabled ? 'text-gray-400' : 'text-accent-gold'}`}>
                                {buttonState.text && buttonState.text.includes('IJIN') ? buttonState.text : 'IJIN'}
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Permit Modal */}
            {isPermitModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-background-light dark:bg-background-dark border border-glass-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in duration-200">
                        {/* Header */}
                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <span className="material-icons-round text-accent-gold">assignment</span>
                                Form Ijin & Sakit
                            </h3>
                            <button
                                onClick={() => setIsPermitModalOpen(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <span className="material-icons-round">close</span>
                            </button>
                        </div>

                        {/* Body */}
                        <form onSubmit={handlePermitSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Jenis Ijin</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <label className="cursor-pointer relative">
                                        <input
                                            type="radio"
                                            name="permitType"
                                            value="sick"
                                            checked={permitType === 'sick'}
                                            onChange={(e) => setPermitType(e.target.value)}
                                            className="sr-only"
                                        />
                                        <div className={`p-3 rounded-lg border flex flex-col items-center gap-1 transition-all ${permitType === 'sick' ? 'bg-red-500/20 border-red-500 text-white' : 'border-white/10 hover:bg-white/5 text-gray-400'}`}>
                                            <span className="material-icons-round">sick</span>
                                            <span className="text-sm font-medium">Sakit</span>
                                        </div>
                                    </label>
                                    <label className="cursor-pointer relative">
                                        <input
                                            type="radio"
                                            name="permitType"
                                            value="khidmat"
                                            checked={permitType === 'khidmat'}
                                            onChange={(e) => setPermitType(e.target.value)}
                                            className="sr-only"
                                        />
                                        <div className={`p-3 rounded-lg border flex flex-col items-center gap-1 transition-all ${permitType === 'khidmat' ? 'bg-blue-500/20 border-blue-500 text-white' : 'border-white/10 hover:bg-white/5 text-gray-400'}`}>
                                            <span className="material-icons-round">volunteer_activism</span>
                                            <span className="text-sm font-medium">Khidmat</span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Keterangan / Alasan</label>
                                <textarea
                                    value={permitReason}
                                    onChange={(e) => setPermitReason(e.target.value)}
                                    placeholder="Contoh: Demam tinggi sejak semalam / Sedang bertugas di dapur umum..."
                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold min-h-[100px]"
                                    required
                                />
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsPermitModalOpen(false)}
                                    className="flex-1 py-3 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 transition-colors font-medium"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingPermit}
                                    className="flex-1 py-3 rounded-lg bg-accent-gold text-primary-dark font-bold hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isSubmittingPermit ? (
                                        <>
                                            <span className="material-icons-round animate-spin text-sm">refresh</span>
                                            MENGIRIM...
                                        </>
                                    ) : 'KIRIM IJIN'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HeroSection;
