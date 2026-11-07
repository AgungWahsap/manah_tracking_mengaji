import React, { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import HeaderAdmin from '../components/HeaderAdmin';
import { recitationService } from '../services/recitation.service';

const STATUS_OPTIONS = [
    { code: 'H', label: 'Hadir', short: 'H', style: 'border-green-500 bg-green-500/20 text-green-300' },
    { code: 'S', label: 'Sakit', short: 'S', style: 'border-yellow-500 bg-yellow-500/20 text-yellow-300' },
    { code: 'I', label: 'Izin', short: 'I', style: 'border-blue-500 bg-blue-500/20 text-blue-300' },
    { code: 'A', label: 'Alfa', short: 'A', style: 'border-red-500 bg-red-500/20 text-red-300' },
];

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

const AdminBulkAttendance = () => {
    const { toggleSidebar } = useOutletContext();
    const [sessions, setSessions] = useState([]);
    const [classes, setClasses] = useState([]);
    const [classId, setClassId] = useState('');
    const [sessionId, setSessionId] = useState('');
    const [date, setDate] = useState(getJakartaDate);
    const [students, setStudents] = useState([]);
    const [statuses, setStatuses] = useState({});
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [loadingAttendance, setLoadingAttendance] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await recitationService.getAttendanceSetup();
                const nextSessions = response.sessions || [];
                setSessions(nextSessions);
                const nextClasses = response.classes || [];
                setClasses(nextClasses);
                setClassId((current) => current || nextClasses.find((item) => item.isActive)?.id || '');
                setSessionId((current) => current || nextSessions[0]?.id || '');
            } catch (loadError) {
                setError(loadError.message || 'Gagal memuat data absensi.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    useEffect(() => {
        if (!sessionId || !date || !classId) {
            setStudents([]);
            setStatuses({});
            return;
        }
        let cancelled = false;
        const loadAttendance = async () => {
            setLoadingAttendance(true);
            setError('');
            setStudents([]);
            setStatuses({});
            try {
                const response = await recitationService.getAttendance(date, sessionId, classId);
                if (!cancelled) {
                    const nextStatuses = {};
                    (response.data || []).forEach((student) => {
                        nextStatuses[student.id] = student.status || 'A';
                    });
                    setStudents(response.data || []);
                    setStatuses(nextStatuses);
                }
            } catch (loadError) {
                if (!cancelled) setError(loadError.message || 'Gagal memuat absensi.');
            } finally {
                if (!cancelled) setLoadingAttendance(false);
            }
        };
        loadAttendance();
        return () => { cancelled = true; };
    }, [date, sessionId, classId]);

    const filteredStudents = useMemo(() => {
        const searchText = search.trim().toLowerCase();
        if (!searchText) return students;
        return students.filter((student) =>
            student.name.toLowerCase().includes(searchText) ||
            (student.nis || '').toLowerCase().includes(searchText),
        );
    }, [search, students]);

    const setStudentStatus = (studentId, status) => {
        setStatuses((current) => ({ ...current, [studentId]: status }));
        setNotice('');
    };

    const handleSave = async () => {
        if (!sessionId || !classId || students.length === 0) return;
        const alphaCount = students.filter((student) => (statuses[student.id] || 'A') === 'A').length;
        if (!window.confirm(
            `Simpan absensi kelas ${currentClass?.name || ''}, sesi ${currentSession?.name || ''} tanggal ${date} untuk ${students.length} santri? ${alphaCount} santri akan tercatat Alfa (A).`,
        )) return;
        setSaving(true);
        setError('');
        setNotice('');
        try {
            const response = await recitationService.saveAttendance({
                date,
                sessionId,
                classId,
                attendance: students.map((student) => ({
                    studentId: student.id,
                    status: statuses[student.id] || 'A',
                })),
            });
            setNotice(`Absensi tersimpan untuk ${response.data.savedCount} santri.`);
        } catch (saveError) {
            setError(saveError.message || 'Gagal menyimpan absensi.');
        } finally {
            setSaving(false);
        }
    };

    const currentSession = sessions.find((session) => session.id === sessionId);
    const currentClass = classes.find((item) => item.id === classId);

    return (
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-4 pb-8 md:px-8">
            <HeaderAdmin onMenuClick={toggleSidebar} />
            <main className="mx-auto max-w-6xl space-y-6 py-6">
                <section className="glass-panel rounded-xl border border-glass-border p-6">
                    <h1 className="text-2xl font-bold text-white">Absensi Mengaji</h1>
                    <p className="mt-1 text-sm text-gray-400">Tentukan status setiap santri, lalu simpan absensi untuk sesi yang dipilih.</p>
                    <div className="mt-6 grid gap-4 md:grid-cols-4">
                        <label className="text-sm text-gray-300">
                            Tanggal
                            <input
                                type="date"
                                value={date}
                                onChange={(event) => setDate(event.target.value)}
                                className="mt-2 block w-full rounded-lg border border-white/10 bg-black/30 p-3 text-white"
                            />
                        </label>
                        <label className="text-sm text-gray-300">
                            Waktu Mengaji
                            <select
                                value={sessionId}
                                onChange={(event) => setSessionId(event.target.value)}
                                className="mt-2 block w-full rounded-lg border border-white/10 bg-black/30 p-3 text-white"
                            >
                                {sessions.map((session) => (
                                    <option key={session.id} value={session.id}>
                                        {session.name[0].toUpperCase() + session.name.slice(1)} ({session.scheduledTime.slice(0, 5)})
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="text-sm text-gray-300">
                            Kelas
                            <select
                                value={classId}
                                onChange={(event) => setClassId(event.target.value)}
                                className="mt-2 block w-full rounded-lg border border-white/10 bg-black/30 p-3 text-white"
                            >
                                {classes.filter((item) => item.isActive).map((item) => (
                                    <option key={item.id} value={item.id}>{item.name}</option>
                                ))}
                            </select>
                        </label>
                        <label className="text-sm text-gray-300">
                            Cari santri
                            <input
                                type="search"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Nama atau NIS"
                                className="mt-2 block w-full rounded-lg border border-white/10 bg-black/30 p-3 text-white placeholder:text-gray-500"
                            />
                        </label>
                    </div>
                </section>

                {error && <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-300">{error}</div>}
                {notice && <div role="status" className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-green-300">{notice}</div>}

                <section className="glass-panel overflow-hidden rounded-xl border border-glass-border">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-5">
                        <div>
                            <h2 className="font-semibold text-white">
                                {currentSession ? `${currentSession.name[0].toUpperCase()}${currentSession.name.slice(1)}` : 'Pilih waktu'}
                                {' — '}{currentClass?.name || 'Pilih kelas'}{' — '}{date}
                            </h2>
                            <p className="mt-1 text-xs text-gray-400">Status santri yang tidak diubah otomatis tersimpan sebagai Alfa (A).</p>
                        </div>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={loading || loadingAttendance || saving || students.length === 0 || !sessionId || !classId}
                            className="rounded-lg bg-green-600 px-5 py-2.5 font-semibold text-white hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {saving ? 'Menyimpan...' : 'Simpan Absensi'}
                        </button>
                    </div>
                    {loading || loadingAttendance ? (
                        <div className="p-10 text-center text-gray-400">Memuat daftar santri dan absensi...</div>
                    ) : students.length === 0 ? (
                        <div className="p-10 text-center text-gray-400">Belum ada santri aktif. Tambahkan daftar santri terlebih dahulu.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[700px] text-left">
                                <thead className="bg-white/5 text-xs uppercase text-gray-400">
                                    <tr>
                                        <th className="p-4">No.</th>
                                        <th className="p-4">Nama Santri</th>
                                        <th className="p-4">NIS</th>
                                        <th className="p-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredStudents.map((student, index) => (
                                        <tr key={student.id} className="hover:bg-white/[0.03]">
                                            <td className="p-4 text-gray-500">{index + 1}</td>
                                            <td className="p-4 font-medium text-white">{student.name}</td>
                                            <td className="p-4 text-gray-400">{student.nis || '—'}</td>
                                            <td className="p-4">
                                                <div className="flex gap-2">
                                                    {STATUS_OPTIONS.map((option) => (
                                                        <button
                                                            key={option.code}
                                                            type="button"
                                                            title={option.label}
                                                            aria-label={`${option.label}: ${student.name}`}
                                                            aria-pressed={(statuses[student.id] || 'A') === option.code}
                                                            onClick={() => setStudentStatus(student.id, option.code)}
                                                            className={`h-9 w-10 rounded-md border text-sm font-bold transition-colors ${
                                                                (statuses[student.id] || 'A') === option.code
                                                                    ? option.style
                                                                    : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
                                                            }`}
                                                        >
                                                            {option.short}
                                                        </button>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredStudents.length === 0 && (
                                        <tr><td colSpan="4" className="p-8 text-center text-gray-400">Santri tidak ditemukan.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default AdminBulkAttendance;
