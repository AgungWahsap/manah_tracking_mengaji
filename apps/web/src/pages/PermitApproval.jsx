import React, { useState, useEffect, useCallback } from 'react';
import { attendanceService } from '../services/attendance.service';

const STATUS_TABS = [
    { key: 'pending', label: 'Pending', icon: 'hourglass_top', color: 'yellow' },
    { key: 'approved', label: 'Disetujui', icon: 'check_circle', color: 'green' },
    { key: 'rejected', label: 'Ditolak', icon: 'cancel', color: 'red' },
    { key: 'all', label: 'Semua', icon: 'list', color: 'gray' },
];

const TYPE_LABELS = {
    sick: { label: 'Sakit', icon: 'sick', color: 'red' },
    permission: { label: 'Khidmat', icon: 'volunteer_activism', color: 'blue' },
    other: { label: 'Lainnya', icon: 'info', color: 'gray' },
};

const PermitApproval = () => {
    const [permits, setPermits] = useState([]);
    const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
    const [activeTab, setActiveTab] = useState('pending');
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(null); // permit ID being processed
    const [confirmDialog, setConfirmDialog] = useState(null); // { id, action, userName }

    const fetchPermits = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const response = await attendanceService.getPendingPermits({
                status: activeTab,
                page,
                limit: 15,
            });
            if (response.success) {
                setPermits(response.data || []);
                setCounts(response.counts || { pending: 0, approved: 0, rejected: 0 });
                setPagination(response.pagination || { page: 1, totalPages: 1, total: 0 });
            }
        } catch (error) {
            console.error('Failed to fetch permits:', error);
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

    useEffect(() => {
        fetchPermits(1);
    }, [fetchPermits]);

    const handleAction = async (permitId, status) => {
        setActionLoading(permitId);
        try {
            const response = await attendanceService.updatePermit(permitId, status);
            if (response.success) {
                // Refresh list
                fetchPermits(pagination.page);
            }
        } catch (error) {
            console.error('Failed to update permit:', error);
            alert(`Gagal ${status === 'approved' ? 'menyetujui' : 'menolak'} ijin: ${error.response?.data?.error?.message || error.message}`);
        } finally {
            setActionLoading(null);
            setConfirmDialog(null);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        return d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    };

    const getStatusBadge = (status) => {
        const styles = {
            pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            approved: 'bg-green-500/20 text-green-400 border-green-500/30',
            rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
        };
        const labels = { pending: 'Pending', approved: 'Disetujui', rejected: 'Ditolak' };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${styles[status] || styles.pending}`}>
                {labels[status] || status}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <span className="material-icons-round text-accent-gold">assignment_turned_in</span>
                        Persetujuan Ijin
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Kelola pengajuan ijin dari santri dan staff</p>
                </div>

                {counts.pending > 0 && (
                    <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-4 py-2">
                        <span className="material-icons-round text-yellow-400 text-sm">notification_important</span>
                        <span className="text-yellow-400 text-sm font-medium">{counts.pending} ijin menunggu persetujuan</span>
                    </div>
                )}
            </div>

            {/* Status Filter Tabs */}
            <div className="flex flex-wrap gap-2">
                {STATUS_TABS.map(tab => {
                    const isActive = activeTab === tab.key;
                    const count = tab.key === 'all'
                        ? counts.pending + counts.approved + counts.rejected
                        : counts[tab.key] || 0;

                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
                                ? `bg-${tab.color}-500/20 border border-${tab.color}-500/40 text-white shadow-sm`
                                : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            <span className="material-icons-round text-base">{tab.icon}</span>
                            {tab.label}
                            {count > 0 && (
                                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${isActive ? 'bg-white/20' : 'bg-white/10'}`}>
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Permits Table */}
            <div className="glass-panel rounded-2xl overflow-hidden border border-glass-border">
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                            <p className="text-gray-400 text-sm">Memuat data...</p>
                        </div>
                    </div>
                ) : permits.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <span className="material-icons-round text-4xl text-gray-600 mb-3">inbox</span>
                        <p className="text-gray-400 font-medium">Tidak ada data ijin</p>
                        <p className="text-gray-500 text-sm mt-1">
                            {activeTab === 'pending' ? 'Belum ada pengajuan ijin yang perlu diproses' : `Tidak ada ijin dengan status "${activeTab}"`}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/10 bg-white/5">
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Santri</th>
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Tanggal</th>
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Waktu Sholat</th>
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Jenis</th>
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Alasan</th>
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                                        {activeTab === 'pending' && (
                                            <th className="text-center py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Aksi</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {permits.map(permit => {
                                        const typeInfo = TYPE_LABELS[permit.type] || TYPE_LABELS.other;
                                        return (
                                            <tr key={permit.id} className="hover:bg-white/5 transition-colors">
                                                <td className="py-3 px-4">
                                                    <div>
                                                        <p className="text-white font-medium text-sm">{permit.userName || '-'}</p>
                                                        <p className="text-gray-500 text-xs">{permit.userNis || '-'}</p>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="text-gray-300 text-sm">{formatDate(permit.date)}</span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="text-gray-300 text-sm capitalize">
                                                        {permit.isFullDay ? 'Seharian' : (permit.prayerName || '-')}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`material-icons-round text-sm text-${typeInfo.color}-400`}>{typeInfo.icon}</span>
                                                        <span className={`text-sm text-${typeInfo.color}-400 font-medium`}>{typeInfo.label}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 max-w-[200px]">
                                                    <p className="text-gray-300 text-sm truncate" title={permit.reason || '-'}>
                                                        {permit.reason || '-'}
                                                    </p>
                                                </td>
                                                <td className="py-3 px-4">
                                                    {getStatusBadge(permit.status)}
                                                </td>
                                                {activeTab === 'pending' && (
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                onClick={() => setConfirmDialog({ id: permit.id, action: 'approved', userName: permit.userName })}
                                                                disabled={actionLoading === permit.id}
                                                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 transition-all text-xs font-medium disabled:opacity-50"
                                                            >
                                                                <span className="material-icons-round text-sm">check</span>
                                                                Setujui
                                                            </button>
                                                            <button
                                                                onClick={() => setConfirmDialog({ id: permit.id, action: 'rejected', userName: permit.userName })}
                                                                disabled={actionLoading === permit.id}
                                                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all text-xs font-medium disabled:opacity-50"
                                                            >
                                                                <span className="material-icons-round text-sm">close</span>
                                                                Tolak
                                                            </button>
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="md:hidden divide-y divide-white/5">
                            {permits.map(permit => {
                                const typeInfo = TYPE_LABELS[permit.type] || TYPE_LABELS.other;
                                return (
                                    <div key={permit.id} className="p-4 space-y-3">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="text-white font-medium">{permit.userName || '-'}</p>
                                                <p className="text-gray-500 text-xs">{permit.userNis || '-'}</p>
                                            </div>
                                            {getStatusBadge(permit.status)}
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div>
                                                <p className="text-gray-500 text-xs">Tanggal</p>
                                                <p className="text-gray-300">{formatDate(permit.date)}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 text-xs">Waktu Sholat</p>
                                                <p className="text-gray-300 capitalize">{permit.isFullDay ? 'Seharian' : (permit.prayerName || '-')}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 text-xs">Jenis</p>
                                                <div className="flex items-center gap-1">
                                                    <span className={`material-icons-round text-sm text-${typeInfo.color}-400`}>{typeInfo.icon}</span>
                                                    <span className={`text-${typeInfo.color}-400 font-medium`}>{typeInfo.label}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 text-xs">Diajukan</p>
                                                <p className="text-gray-300">{formatTime(permit.createdAt)}</p>
                                            </div>
                                        </div>

                                        {permit.reason && (
                                            <div className="bg-white/5 rounded-lg p-2.5">
                                                <p className="text-gray-500 text-xs mb-1">Alasan</p>
                                                <p className="text-gray-300 text-sm">{permit.reason}</p>
                                            </div>
                                        )}

                                        {activeTab === 'pending' && (
                                            <div className="flex gap-2 pt-1">
                                                <button
                                                    onClick={() => setConfirmDialog({ id: permit.id, action: 'approved', userName: permit.userName })}
                                                    disabled={actionLoading === permit.id}
                                                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 transition-all text-sm font-medium disabled:opacity-50"
                                                >
                                                    <span className="material-icons-round text-base">check_circle</span>
                                                    Setujui
                                                </button>
                                                <button
                                                    onClick={() => setConfirmDialog({ id: permit.id, action: 'rejected', userName: permit.userName })}
                                                    disabled={actionLoading === permit.id}
                                                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all text-sm font-medium disabled:opacity-50"
                                                >
                                                    <span className="material-icons-round text-base">cancel</span>
                                                    Tolak
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <div className="flex items-center justify-between p-4 border-t border-white/10">
                                <p className="text-gray-400 text-sm">
                                    Halaman {pagination.page} dari {pagination.totalPages} ({pagination.total} data)
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => fetchPermits(pagination.page - 1)}
                                        disabled={pagination.page <= 1}
                                        className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-sm"
                                    >
                                        Sebelumnya
                                    </button>
                                    <button
                                        onClick={() => fetchPermits(pagination.page + 1)}
                                        disabled={pagination.page >= pagination.totalPages}
                                        className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-sm"
                                    >
                                        Selanjutnya
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Confirmation Dialog */}
            {confirmDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-background-light dark:bg-background-dark border border-glass-border rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
                        <div className="p-6 text-center space-y-4">
                            <span className={`material-icons-round text-5xl ${confirmDialog.action === 'approved' ? 'text-green-400' : 'text-red-400'}`}>
                                {confirmDialog.action === 'approved' ? 'check_circle_outline' : 'highlight_off'}
                            </span>
                            <div>
                                <h3 className="text-white font-bold text-lg">
                                    {confirmDialog.action === 'approved' ? 'Setujui Ijin?' : 'Tolak Ijin?'}
                                </h3>
                                <p className="text-gray-400 text-sm mt-2">
                                    {confirmDialog.action === 'approved'
                                        ? `Ijin dari ${confirmDialog.userName} akan disetujui dan dihitung sebagai "Excused" dalam rekap.`
                                        : `Ijin dari ${confirmDialog.userName} akan ditolak dan dianggap sebagai Alpha dalam rekap.`
                                    }
                                </p>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setConfirmDialog(null)}
                                    className="flex-1 py-2.5 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 transition-colors font-medium"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={() => handleAction(confirmDialog.id, confirmDialog.action)}
                                    disabled={actionLoading}
                                    className={`flex-1 py-2.5 rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${confirmDialog.action === 'approved'
                                        ? 'bg-green-600 text-white hover:bg-green-500'
                                        : 'bg-red-600 text-white hover:bg-red-500'
                                        }`}
                                >
                                    {actionLoading ? (
                                        <span className="material-icons-round animate-spin text-sm">refresh</span>
                                    ) : (
                                        confirmDialog.action === 'approved' ? 'Setujui' : 'Tolak'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PermitApproval;
