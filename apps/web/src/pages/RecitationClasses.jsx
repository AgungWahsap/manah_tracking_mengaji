import React, { useEffect, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import HeaderAdmin from '../components/HeaderAdmin';
import { recitationService } from '../services/recitation.service';

const RecitationClasses = () => {
    const { toggleSidebar } = useOutletContext();
    const fileInput = useRef(null);
    const [classes, setClasses] = useState([]);
    const [selectedId, setSelectedId] = useState('');
    const [className, setClassName] = useState('');
    const [loading, setLoading] = useState(true);
    const [working, setWorking] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    const loadClasses = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await recitationService.getClasses({ includeInactive: true });
            const activeClasses = response.data || [];
            setClasses(activeClasses);
            setSelectedId((current) => activeClasses.some((item) => item.id === current)
                ? current
                : activeClasses.find((item) => item.isActive)?.id || '');
        } catch (loadError) {
            setError(loadError.message || 'Gagal memuat daftar kelas.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadClasses(); }, []);

    const selectedClass = classes.find((item) => item.id === selectedId);

    const handleCreateClass = async (event) => {
        event.preventDefault();
        if (!className.trim()) return;
        setWorking(true);
        setError('');
        setNotice('');
        try {
            const response = await recitationService.createClass(className.trim());
            setClassName('');
            await loadClasses();
            setSelectedId(response.data.id);
            setNotice('Kelas berhasil ditambahkan.');
        } catch (createError) {
            setError(createError.message || 'Gagal menambahkan kelas.');
        } finally {
            setWorking(false);
        }
    };

    const handleDownload = async () => {
        if (!selectedClass) return;
        setWorking(true);
        setError('');
        setNotice('');
        try {
            const response = await recitationService.exportClassTemplate(selectedClass.id);
            const url = URL.createObjectURL(response);
            const link = document.createElement('a');
            link.href = url;
            link.download = `daftar-santri-${selectedClass.name.replace(/[^\p{L}\p{N}-]+/gu, '-')}.xlsx`;
            link.click();
            URL.revokeObjectURL(url);
        } catch (exportError) {
            setError(exportError.message || 'Gagal mengunduh template Excel.');
        } finally {
            setWorking(false);
        }
    };

    const handleImportFile = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file || !selectedClass) return;
        if (!file.name.toLowerCase().endsWith('.xlsx')) {
            setError('Pilih file Excel dengan format .xlsx.');
            return;
        }
        if (file.size > 3 * 1024 * 1024) {
            setError('Ukuran file maksimal 3 MB.');
            return;
        }

        setWorking(true);
        setError('');
        setNotice('');
        try {
            const dataUrl = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onerror = () => reject(new Error('File Excel tidak dapat dibaca.'));
                reader.onload = () => resolve(reader.result);
                reader.readAsDataURL(file);
            });
            const base64 = String(dataUrl).split(',')[1];
            const response = await recitationService.importClassStudents(selectedClass.id, base64);
            setNotice(`Impor selesai: ${response.data.added} santri baru, ${response.data.updated} data diperbarui, ${response.data.moved} dipindahkan ke kelas ini.`);
            await loadClasses();
        } catch (importError) {
            setError(importError.message || 'Gagal mengimpor daftar Excel.');
        } finally {
            setWorking(false);
        }
    };

    const handleToggleClass = async () => {
        if (!selectedClass) return;
        const action = selectedClass.isActive ? 'menonaktifkan' : 'mengaktifkan';
        if (!window.confirm(`Yakin ingin ${action} kelas ${selectedClass.name}?`)) return;
        setWorking(true);
        setError('');
        setNotice('');
        try {
            await recitationService.updateClass(selectedClass.id, { isActive: !selectedClass.isActive });
            setNotice(`Kelas ${selectedClass.name} berhasil ${selectedClass.isActive ? 'dinonaktifkan' : 'diaktifkan'}.`);
            await loadClasses();
        } catch (updateError) {
            setError(updateError.message || 'Gagal memperbarui kelas.');
        } finally {
            setWorking(false);
        }
    };

    return (
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-4 pb-8 md:px-8">
            <HeaderAdmin onMenuClick={toggleSidebar} title="Kelas & Impor/Export" />
            <main className="mx-auto max-w-5xl space-y-6 py-6">
                <section className="glass-panel rounded-xl border border-glass-border p-6">
                    <h1 className="text-2xl font-bold text-white">Manajemen Kelas</h1>
                    <p className="mt-1 text-sm text-gray-400">
                        Kelompokkan daftar santri. Template Excel berisi nama peserta yang sudah ada dan dapat ditambah atau diperbarui.
                    </p>
                    <form onSubmit={handleCreateClass} className="mt-6 flex flex-col gap-3 sm:flex-row">
                        <input
                            required
                            maxLength={100}
                            value={className}
                            onChange={(event) => setClassName(event.target.value)}
                            placeholder="Nama kelas baru"
                            className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/30 p-3 text-white placeholder:text-gray-500"
                        />
                        <button
                            type="submit"
                            disabled={working}
                            className="rounded-lg bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-500 disabled:opacity-50"
                        >
                            Tambah Kelas
                        </button>
                    </form>
                </section>

                {error && <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-300">{error}</div>}
                {notice && <div role="status" className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-green-300">{notice}</div>}

                <section className="glass-panel rounded-xl border border-glass-border p-6">
                    {loading ? (
                        <p className="text-gray-400">Memuat daftar kelas...</p>
                    ) : classes.length === 0 ? (
                        <p className="text-gray-400">Belum ada kelas. Tambahkan kelas di atas untuk mulai mengelola santri.</p>
                    ) : (
                        <>
                            <label className="block text-sm text-gray-300">
                                Pilih kelas
                                <select
                                    value={selectedId}
                                    onChange={(event) => setSelectedId(event.target.value)}
                                    className="mt-2 block w-full rounded-lg border border-white/10 bg-black/30 p-3 text-white"
                                >
                                    {classes.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.name} — {item.studentCount} santri{item.isActive ? '' : ' (nonaktif)'}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            {selectedClass && (
                                <div className="mt-5 rounded-lg border border-white/10 bg-black/20 p-5">
                                    <div className="flex flex-wrap items-start justify-between gap-4">
                                        <div>
                                            <h2 className="text-lg font-semibold text-white">{selectedClass.name}</h2>
                                            <p className="mt-1 text-sm text-gray-400">{selectedClass.studentCount} santri terdaftar</p>
                                            <p className="mt-3 max-w-2xl text-xs leading-5 text-gray-500">
                                                Isi kolom <strong>Nama Santri</strong> pada file .xlsx; NIS opsional. Impor memperbarui data berdasarkan NIS atau nama dalam kelas. Santri dengan NIS yang sama dipindahkan ke kelas terpilih. Baris kosong diabaikan dan data yang tidak ada di file tidak dihapus.
                                            </p>
                                        </div>
                                        <span className={`rounded-full px-3 py-1 text-xs ${selectedClass.isActive ? 'bg-green-500/10 text-green-300' : 'bg-gray-500/10 text-gray-400'}`}>
                                            {selectedClass.isActive ? 'Aktif' : 'Nonaktif'}
                                        </span>
                                    </div>
                                    <div className="mt-5 flex flex-wrap gap-3">
                                        <button
                                            type="button"
                                            onClick={handleDownload}
                                            disabled={working || !selectedClass.isActive}
                                            className="rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-gray-200 hover:bg-white/5 disabled:opacity-50"
                                        >
                                            Download Excel (.xlsx)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => fileInput.current?.click()}
                                            disabled={working || !selectedClass.isActive}
                                            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/80 disabled:opacity-50"
                                        >
                                            {working ? 'Memproses...' : 'Impor Excel'}
                                        </button>
                                        <input ref={fileInput} type="file" accept=".xlsx" className="hidden" onChange={handleImportFile} />
                                        <button
                                            type="button"
                                            onClick={handleToggleClass}
                                            disabled={working}
                                            className="ml-auto rounded-lg border border-yellow-500/30 px-4 py-2.5 text-sm text-yellow-300 hover:bg-yellow-500/10 disabled:opacity-50"
                                        >
                                            {selectedClass.isActive ? 'Nonaktifkan Kelas' : 'Aktifkan Kelas'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </section>
            </main>
        </div>
    );
};

export default RecitationClasses;
