import React, { useState } from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { attendanceService } from '../../services/attendance.service';

const RecapDetailModal = ({ isOpen, onClose, data, date, onUpdate }) => {
    const [isUpdating, setIsUpdating] = useState(false);

    if (!isOpen || !data) return null;

    const { user, attendance, permit } = data;

    const handleUpdateStatus = async (status) => {
        if (!permit) return;
        if (!confirm(`Apakah anda yakin ingin mengubah status menjadi ${status}?`)) return;

        setIsUpdating(true);
        try {
            await attendanceService.updatePermit(permit.id, status);
            alert(`Berhasil mengubah status izin menjadi ${status}`);
            if (onUpdate) onUpdate(); // Refresh parent data
            onClose();
        } catch (error) {
            console.error("Update permit failed:", error);
            alert("Gagal mengubah status izin");
        } finally {
            setIsUpdating(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'present': return 'text-green-400 bg-green-500/10 border-green-500/20';
            case 'late': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
            case 'absent': return 'text-red-400 bg-red-500/10 border-red-500/20';
            case 'excused': return 'text-indigo-300 bg-indigo-500/10 border-indigo-500/20';
            default: return 'text-gray-400 bg-white/5 border-white/10';
        }
    };

    const formatTime = (timeStr) => timeStr?.substring(0, 5) || '-';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-[#121212] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden glass-panel relative">

                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-start bg-white/5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-lg font-bold text-white shadow-lg border border-white/10">
                            {user.name?.charAt(0) || '?'}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">{user.name}</h3>
                            <p className="text-sm text-gray-400">
                                {user.role?.toUpperCase()} • NIS: {user.nis || '-'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    >
                        <span className="material-icons-round">close</span>
                    </button>
                </div>

                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">

                    {/* Permit Section (if exists) */}
                    {permit && (
                        <div className={`border rounded-xl p-4 ${permit.status === 'pending'
                                ? 'bg-yellow-500/10 border-yellow-500/20'
                                : 'bg-indigo-500/10 border-indigo-500/20'
                            }`}>
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`material-icons-round ${permit.status === 'pending' ? 'text-yellow-500' : 'text-indigo-400'
                                            }`}>
                                            {permit.status === 'pending' ? 'hourglass_empty' : 'medical_services'}
                                        </span>
                                        <h4 className={`font-bold ${permit.status === 'pending' ? 'text-yellow-500' : 'text-indigo-300'
                                            }`}>
                                            Status: {
                                                permit.status === 'pending' ? 'Menunggu Persetujuan' :
                                                    (permit.type === 'sick' ? 'Sakit' : 'Izin')
                                            }
                                        </h4>
                                    </div>
                                    <div className={`text-sm pl-9 ${permit.status === 'pending' ? 'text-yellow-200/80' : 'text-indigo-200/80'
                                        }`}>
                                        <p className="font-semibold mb-1">Alasan:</p>
                                        <p className="italic">"{permit.reason || 'Tidak ada keterangan spesifik'}"</p>
                                    </div>
                                </div>

                                {/* Approval Actions */}
                                {permit.status === 'pending' && (
                                    <div className="flex flex-col gap-2 min-w-[120px]">
                                        <button
                                            onClick={() => handleUpdateStatus('approved')}
                                            disabled={isUpdating}
                                            className="px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 text-xs font-bold rounded-lg border border-green-500/20 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <span className="material-icons-round text-sm">check</span>
                                            Terima
                                        </button>
                                        <button
                                            onClick={() => handleUpdateStatus('rejected')}
                                            disabled={isUpdating}
                                            className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-bold rounded-lg border border-red-500/20 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <span className="material-icons-round text-sm">close</span>
                                            Tolak
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Attendance Grid */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <span className="material-icons-round text-base">history</span>
                            Riwayat Kehadiran ({date})
                        </h4>

                        <div className="grid gap-3">
                            {Object.entries(attendance).map(([prayerName, record]) => (
                                <div key={prayerName} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-8 rounded-full bg-white/10"></div>
                                        <span className="font-medium text-gray-200 capitalize">{prayerName}</span>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className={`px-2.5 py-0.5 rounded text-xs font-bold border ${getStatusColor(record.status)}`}>
                                                {record.status === 'present' ? 'HADIR' :
                                                    record.status === 'late' ? 'TELAT' :
                                                        record.status === 'absent' ? 'ALPHA' :
                                                            record.status === 'pending' ? 'BELUM' : record.status}
                                            </div>
                                        </div>
                                        <div className="font-mono text-gold text-sm w-16 text-right">
                                            {record.checkInTime ? formatTime(record.checkInTime) : '--:--'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10 bg-black/20 text-right">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RecapDetailModal;
