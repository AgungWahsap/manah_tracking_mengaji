
import React, { useState, useEffect } from 'react';
import codeService from '../services/code.service';
import { useOutletContext } from 'react-router-dom';

const CodeManagement = () => {
    const [codes, setCodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchCodes();
    }, [page, search]);

    const fetchCodes = async () => {
        setLoading(true);
        try {
            const result = await codeService.listCodes({ page, search, limit: 20 });
            console.log('Fetch result:', result);
            if (result.success) {
                setCodes(result.data);
                setTotalPages(result.pagination.totalPages);
                // Temporary debug alert
                // alert(`Fetch Success! Loaded ${result.data.length} codes.`);
            } else {
                console.error('Fetch failed success flag:', result);
            }
        } catch (error) {
            console.error('Failed to fetch codes:', error);
            alert("Gagal mengambil data kode: " + (error.response?.data?.error?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        // Simple prompt for now
        const name = prompt("Masukkan Nama Pengguna:");
        if (!name) return;
        const role = prompt("Role (santri/admin/staff/guest):", "santri");

        // Generate random code
        const prefix = name.substring(0, 2).toUpperCase();
        const random = Math.floor(1000 + Math.random() * 9000);
        const generatedCode = `${prefix}-${random}`;

        try {
            const payload = {
                code: generatedCode,
                userData: {
                    name,
                    role: role || 'santri',
                    nis: Date.now().toString().slice(-6), // Dummy NIS
                    email: `${name.replace(/\s+/g, '.').toLowerCase()}@example.com`,
                }
            };
            await codeService.createCode(payload);
            alert(`Kode berhasil dibuat: ${generatedCode}`);
            setPage(1);
            setSearch('');
            setTimeout(() => fetchCodes(), 500);
        } catch (error) {
            console.error('Create error:', error);
            alert("Gagal membuat kode: " + (error.response?.data?.error?.message || error.message));
        }
    };

    const handleDelete = async (id) => {
        if (confirm("Yakin ingin menghapus kode ini?")) {
            try {
                await codeService.deleteCode(id);
                fetchCodes();
            } catch (error) {
                alert("Gagal menghapus kode");
            }
        }
    };

    const { toggleSidebar } = useOutletContext(); // Get toggle function from AdminLayout

    return (
        <div className="flex flex-col h-full relative">
            {/* Background Decor can remain if needed, or be moved to Layout */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-primary/20 via-transparent to-transparent pointer-events-none z-0"></div>
            <div className="absolute -top-20 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none z-0"></div>

            <header className="h-20 flex items-center justify-between px-8 z-10 border-b border-glass-border glass-panel m-4 rounded-xl mb-0">
                <div className="flex items-center gap-4">
                    {/* Mobile Menu Button */}
                    <button
                        onClick={toggleSidebar}
                        className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <span className="material-icons-round text-2xl">menu</span>
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">Manajemen Kode Akses</h2>
                        <div className="flex items-center gap-2 text-sm text-gray-400 mt-0.5">
                            <span className="material-icons-round text-gold text-sm">vpn_key</span>
                            <span>Total Active Codes: {codes.length}</span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex-1 p-4 overflow-hidden flex flex-col z-10">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4 p-1">
                    <div className="flex items-center gap-3 flex-1 min-w-[300px]">
                        <div className="relative flex-1 max-w-md group">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-gold transition-colors material-icons-round">search</span>
                            <input
                                className="w-full bg-black/20 border border-white/10 text-white text-sm rounded-lg focus:ring-1 focus:ring-gold focus:border-gold block pl-10 p-2.5 placeholder-gray-500 transition-all"
                                placeholder="Search by code or name..."
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={handleCreate} className="flex items-center gap-2 px-4 py-2 bg-gold hover:bg-[#bfa05f] text-primary-dark rounded-lg font-bold text-sm shadow-lg shadow-gold/20 transition-all transform hover:scale-105">
                            <span className="material-icons-round text-sm">add</span>
                            <span>Add New Code</span>
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden rounded-xl border border-glass-border glass-panel flex flex-col">
                    <div className="overflow-x-auto custom-scrollbar flex-1">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 z-20 bg-[#0d4a3a]/90 backdrop-blur-md shadow-sm">
                                <tr>
                                    <th className="p-4 text-xs font-semibold tracking-wide text-gray-400 uppercase border-b border-white/10 w-48">Unique Code</th>
                                    <th className="p-4 text-xs font-semibold tracking-wide text-gray-400 uppercase border-b border-white/10 min-w-[200px]">Assigned To</th>
                                    <th className="p-4 text-xs font-semibold tracking-wide text-gray-400 uppercase border-b border-white/10 w-32">Role</th>
                                    <th className="p-4 text-xs font-semibold tracking-wide text-gray-400 uppercase border-b border-white/10 w-48">Expires</th>
                                    <th className="p-4 text-xs font-semibold tracking-wide text-gray-400 uppercase border-b border-white/10 text-center w-32">Status</th>
                                    <th className="p-4 text-xs font-semibold tracking-wide text-gray-400 uppercase border-b border-white/10 text-right w-24">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm text-gray-300">
                                {loading ? (
                                    <tr><td colSpan="6" className="p-8 text-center">Loading...</td></tr>
                                ) : codes.length === 0 ? (
                                    <tr><td colSpan="6" className="p-8 text-center">No codes found</td></tr>
                                ) : (
                                    codes.map((code) => (
                                        <tr key={code.id} className="glass-row group">
                                            <td className="p-4 font-mono text-gold tracking-wider">
                                                <span className="bg-gold/10 px-2 py-1 rounded border border-gold/20">{code.code}</span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white shadow-md">
                                                        {code.user?.name?.charAt(0) || '?'}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-white">{code.user?.name || 'Unassigned'}</div>
                                                        <div className="text-xs text-gray-500">{code.user?.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">{code.user?.role || 'N/A'}</span>
                                            </td>
                                            <td className="p-4 text-gray-400 text-sm">
                                                {code.expiresAt ? new Date(code.expiresAt).toLocaleDateString() : 'Never'}
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className={`inline-flex items-center justify-center px-2 py-1 rounded text-xs font-medium w-full ${code.status === 'active' ? 'bg-green-500/20 text-green-400 border border-green-500/20' : 'bg-red-500/20 text-red-400'
                                                    }`}>
                                                    {code.status}
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button onClick={() => handleDelete(code.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors">
                                                    <span className="material-icons-round text-lg">delete</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    <div className="p-4 border-t border-glass-border bg-black/20 flex items-center justify-between text-xs text-gray-400">
                        <div>
                            Showing {(page - 1) * 10 + 1}-{Math.min(page * 10, codes.length > 0 ? (page - 1) * 10 + codes.length : 0)} of {totalPages * 10} (approx)
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(Math.max(1, page - 1))}
                                disabled={page === 1}
                                className="p-1 rounded hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <span className="material-icons-round text-base">chevron_left</span>
                            </button>

                            {/* Simple Page Indicator */}
                            <span className="text-gray-300 font-medium">Page {page} of {totalPages}</span>

                            <button
                                onClick={() => setPage(Math.min(totalPages, page + 1))}
                                disabled={page === totalPages}
                                className="p-1 rounded hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <span className="material-icons-round text-base">chevron_right</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CodeManagement;
