import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import HeaderAdmin from '../components/HeaderAdmin';
import { recitationService } from '../services/recitation.service';

const EMPTY_FORM = { name: '', nis: '' };

const DataSantri = () => {
    const { toggleSidebar } = useOutletContext();
    const [students, setStudents] = useState([]);
    const [search, setSearch] = useState('');
    const [form, setForm] = useState(EMPTY_FORM);
    const [editingId, setEditingId] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    const loadStudents = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await recitationService.getStudents({ search, includeInactive: true });
            setStudents(response.data || []);
        } catch (loadError) {
            setError(loadError.message || 'Gagal memuat data santri.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStudents();
    }, [search]);

    const resetForm = () => {
        setForm(EMPTY_FORM);
        setEditingId('');
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError('');
        setNotice('');
        try {
            const payload = { name: form.name.trim(), nis: form.nis.trim() || null };
            if (editingId) {
                await recitationService.updateStudent(editingId, payload);
                setNotice('Data santri berhasil diperbarui.');
            } else {
                await recitationService.createStudent(payload);
                setNotice('Santri berhasil ditambahkan.');
            }
            resetForm();
            await loadStudents();
        } catch (saveError) {
            setError(saveError.message || 'Gagal menyimpan data santri.');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (student) => {
        setEditingId(student.id);
        setForm({ name: student.name, nis: student.nis || '' });
        setNotice('');
        setError('');
    };

    const handleToggleActive = async (student) => {
        setError('');
        setNotice('');
        try {
            await recitationService.updateStudent(student.id, { isActive: !student.isActive });
            setNotice(`${student.name} ${student.isActive ? 'dinonaktifkan' : 'diaktifkan'}.`);
            await loadStudents();
        } catch (updateError) {
            setError(updateError.message || 'Gagal mengubah status santri.');
        }
    };

    return (
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-4 pb-8 md:px-8">
            <HeaderAdmin onMenuClick={toggleSidebar} />
            <main className="mx-auto max-w-6xl space-y-6 py-6">
                <section className="glass-panel rounded-xl border border-glass-border p-6">
                    <h1 className="text-2xl font-bold text-white">Data Santri</h1>
                    <p className="mt-1 text-sm text-gray-400">Daftar peserta absensi. Data ini tidak memiliki akun login.</p>
                    <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-[1fr_1fr_auto_auto] md:items-end">
                        <label className="text-sm text-gray-300">
                            Nama santri
                            <input
                                required
                                maxLength={255}
                                value={form.name}
                                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                                className="mt-2 block w-full rounded-lg border border-white/10 bg-black/30 p-3 text-white"
                                placeholder="Nama lengkap"
                            />
                        </label>
                        <label className="text-sm text-gray-300">
                            NIS (opsional)
                            <input
                                maxLength={50}
                                value={form.nis}
                                onChange={(event) => setForm((current) => ({ ...current, nis: event.target.value }))}
                                className="mt-2 block w-full rounded-lg border border-white/10 bg-black/30 p-3 text-white"
                                placeholder="Nomor induk"
                            />
                        </label>
                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-lg bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-500 disabled:opacity-50"
                        >
                            {saving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambah Santri'}
                        </button>
                        {editingId && (
                            <button type="button" onClick={resetForm} className="rounded-lg border border-white/10 px-4 py-3 text-gray-300 hover:bg-white/5">
                                Batal
                            </button>
                        )}
                    </form>
                </section>

                {error && <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-300">{error}</div>}
                {notice && <div role="status" className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-green-300">{notice}</div>}

                <section className="glass-panel overflow-hidden rounded-xl border border-glass-border">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-5">
                        <h2 className="font-semibold text-white">Daftar peserta ({students.length})</h2>
                        <input
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Cari nama atau NIS"
                            className="w-full max-w-sm rounded-lg border border-white/10 bg-black/30 p-2.5 text-sm text-white placeholder:text-gray-500"
                        />
                    </div>
                    {loading ? (
                        <div className="p-10 text-center text-gray-400">Memuat daftar santri...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[600px] text-left">
                                <thead className="bg-white/5 text-xs uppercase text-gray-400">
                                    <tr>
                                        <th className="p-4">Nama</th>
                                        <th className="p-4">NIS</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {students.map((student) => (
                                        <tr key={student.id} className="hover:bg-white/[0.03]">
                                            <td className="p-4 font-medium text-white">{student.name}</td>
                                            <td className="p-4 text-gray-400">{student.nis || '—'}</td>
                                            <td className="p-4">
                                                <span className={`rounded-full px-2.5 py-1 text-xs ${student.isActive ? 'bg-green-500/10 text-green-300' : 'bg-gray-500/10 text-gray-400'}`}>
                                                    {student.isActive ? 'Aktif' : 'Nonaktif'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button type="button" onClick={() => handleEdit(student)} className="mr-3 text-sm text-blue-300 hover:text-blue-200">
                                                    Ubah
                                                </button>
                                                <button type="button" onClick={() => handleToggleActive(student)} className="text-sm text-yellow-300 hover:text-yellow-200">
                                                    {student.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {students.length === 0 && (
                                        <tr><td colSpan="4" className="p-8 text-center text-gray-400">Belum ada data santri.</td></tr>
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

export default DataSantri;
