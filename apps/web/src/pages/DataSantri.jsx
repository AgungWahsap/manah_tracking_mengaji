import React, { useState } from 'react';
import { useUsers, useCreateUser, useDeleteUser, useUpdateUser } from '../hooks/useUser';
import { useOutletContext } from 'react-router-dom';

const DataSantri = () => {
    // State
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'santri', // default
        nis: '',
        category: '',
        asramaId: null, // Future: dropdown from useAsrama
    });

    // Hooks
    const { data: usersData, isLoading } = useUsers({ page, limit: 10, search, role: roleFilter });
    const createUserMutation = useCreateUser();
    const updateUserMutation = useUpdateUser();
    const deleteUserMutation = useDeleteUser();

    // Derived Data
    const users = usersData?.data || [];
    const pagination = usersData?.pagination || { page: 1, totalPages: 1, total: 0 };

    // Handlers
    const handleSearch = (e) => setSearch(e.target.value);
    const handleRoleFilters = (e) => setRoleFilter(e.target.value === 'Semua Peran' ? '' : e.target.value.toLowerCase());

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCreateClick = () => {
        setFormData({
            name: '',
            email: '',
            role: 'santri',
            nis: '',
            category: '',
            asramaId: null,
            id: null // clear ID for create mode
        });
        setIsCreateModalOpen(true);
    }

    const handleEditClick = (user) => {
        setFormData({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            nis: user.nis || '',
            category: user.category || '',
            asramaId: user.asramaId || null,
        });
        setIsCreateModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic Validation
        if (!formData.name || !formData.email) {
            alert('Nama dan Email wajib diisi');
            return;
        }

        try {
            if (formData.id) {
                // Update Mode
                await updateUserMutation.mutateAsync({ id: formData.id, data: formData });
                alert('User berhasil diperbarui!');
            } else {
                // Create Mode
                await createUserMutation.mutateAsync(formData);
                alert(`User berhasil dibuat! Kode akses otomatis dibuat.`);
            }
            setIsCreateModalOpen(false);
            setFormData({ name: '', email: '', role: 'santri', nis: '', category: '', asramaId: null });
        } catch (error) {
            alert(`Gagal menyimpan: ${error.message}`);
        }
    };

    const handleDelete = async (id) => {
        if (confirm('Apakah Anda yakin ingin menghapus user ini?')) {
            try {
                await deleteUserMutation.mutateAsync(id);
            } catch (error) {
                alert(`Gagal menghapus: ${error.message}`);
            }
        }
    };

    const { toggleSidebar } = useOutletContext(); // Get toggle function

    return (
        <div className="flex flex-col h-full relative">
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
                        <h2 className="text-2xl font-bold text-white tracking-tight">Data Santri dan Staff</h2>
                        <div className="flex items-center gap-2 text-sm text-gray-400 mt-0.5">
                            <span className="material-icons-round text-gold text-sm">folder_shared</span>
                            <span>Direktori Lengkap</span>
                            <span className="text-gray-600">•</span>
                            <span>Total {pagination.total} Pengguna</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-lg bg-black/20 border border-white/5">
                        <div className="text-right">
                            <div className="text-xs text-gray-400">Total</div>
                            <div className="text-lg font-bold text-white">{pagination.total}</div>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-primary/30 flex items-center justify-center text-gold">
                            <span className="material-icons-round">school</span>
                        </div>
                    </div>
                    <button className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-300 relative transition-colors">
                        <span className="material-icons-round">notifications</span>
                        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 border border-black"></span>
                    </button>
                </div>
            </header>

            <div className="flex-1 p-4 overflow-hidden flex flex-col z-10">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4 p-1">
                    <div className="flex items-center gap-3 flex-1 min-w-[300px]">
                        <div className="relative flex-1 max-w-md group">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-gold transition-colors material-icons-round">search</span>
                            <input
                                className="w-full bg-black/20 border border-white/10 text-white text-sm rounded-lg focus:ring-1 focus:ring-gold focus:border-gold block pl-10 p-2.5 placeholder-gray-500 transition-all"
                                placeholder="Cari nama, email, atau NIS..."
                                type="text"
                                value={search}
                                onChange={handleSearch}
                            />
                        </div>
                        <div className="relative">
                            <select
                                className="bg-black/20 border border-white/10 text-gray-300 text-sm rounded-lg focus:ring-gold focus:border-gold block p-2.5 pr-8 cursor-pointer hover:bg-black/30 transition-colors appearance-none min-w-[140px]"
                                onChange={handleRoleFilters}
                            >
                                <option>Semua Peran</option>
                                <option>Santri</option>
                                <option>Staff</option>
                                <option>Admin</option>
                                <option>Guest</option>
                            </select>
                            <span className="material-icons-round absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none text-sm">expand_more</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleCreateClick}
                            className="flex items-center gap-2 px-4 py-2 bg-gold hover:bg-gold-light text-primary-dark rounded-lg font-bold text-sm shadow-lg shadow-gold/20 transition-all transform hover:scale-105"
                        >
                            <span className="material-icons-round text-sm">add</span>
                            <span>Tambah Baru</span>
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden rounded-xl border border-glass-border glass-panel flex flex-col">
                    <div className="overflow-x-auto custom-scrollbar flex-1">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 z-20 bg-[#0d4a3a]/90 backdrop-blur-md shadow-sm">
                                <tr>
                                    <th className="p-4 text-xs font-semibold tracking-wide text-gray-400 uppercase border-b border-white/10 w-24">
                                        ID Number / NIS
                                    </th>
                                    <th className="p-4 text-xs font-semibold tracking-wide text-gray-400 uppercase border-b border-white/10 min-w-[250px]">
                                        Name
                                    </th>
                                    <th className="p-4 text-xs font-semibold tracking-wide text-gray-400 uppercase border-b border-white/10">Role</th>
                                    <th className="p-4 text-xs font-semibold tracking-wide text-gray-400 uppercase border-b border-white/10">Kamar / Divisi</th>
                                    <th className="p-4 text-xs font-semibold tracking-wide text-gray-400 uppercase border-b border-white/10">Status</th>
                                    <th className="p-4 text-xs font-semibold tracking-wide text-gray-400 uppercase border-b border-white/10 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm text-gray-300">
                                {isLoading ? (
                                    <tr><td colSpan="6" className="p-8 text-center text-gray-400">Memuat data...</td></tr>
                                ) : users.length === 0 ? (
                                    <tr><td colSpan="6" className="p-8 text-center text-gray-400">Tidak ada data ditemukan.</td></tr>
                                ) : (
                                    users.map((user) => (
                                        <tr key={user.id} className="glass-row group">
                                            <td className="p-4 font-mono text-xs text-gold/80">{user.nis || '-'}</td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-primary/50 flex items-center justify-center text-xs font-bold text-white shadow-md ring-2 ring-transparent group-hover:ring-gold/30 transition-all">
                                                        {user.name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-white group-hover:text-gold transition-colors">{user.name}</div>
                                                        <div className="text-xs text-gray-500">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${getRoleStyle(user.role)}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${getRoleDot(user.role)}`}></span>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="p-4 text-gray-400">{user.asramaName ? `${user.asramaName} ${user.asramaRoom}` : '-'}</td>
                                            <td className="p-4">
                                                <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${getStatusStyle(user.status)}`}>
                                                    {user.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleEditClick(user)}
                                                        className="p-1.5 rounded-md hover:bg-gold/20 text-gray-400 hover:text-gold transition-colors"
                                                        title="Edit"
                                                    >
                                                        <span className="material-icons-round text-lg">edit</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(user.id)}
                                                        className="p-1.5 rounded-md hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <span className="material-icons-round text-lg">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="p-4 border-t border-glass-border bg-black/20 flex items-center justify-between text-xs text-gray-400">
                        <div>Menampilkan {users.length} dari {pagination.total} Data</div>
                        <div className="flex items-center gap-2">
                            <button
                                className="p-1 rounded hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={page <= 1}
                                onClick={() => setPage(p => p - 1)}
                            >
                                <span className="material-icons-round text-base">chevron_left</span>
                            </button>
                            <span className="px-2">{page} / {pagination.totalPages}</span>
                            <button
                                className="p-1 rounded hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={page >= pagination.totalPages}
                                onClick={() => setPage(p => p + 1)}
                            >
                                <span className="material-icons-round text-base">chevron_right</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <footer className="mt-4 text-center text-xs text-gray-600">
                © 2024 Manah Tracking System. Developed for Pesantren Administration.
            </footer>

            {/* Create/Edit User Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-background-dark border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden glass-panel">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white">{formData.id ? 'Edit User' : 'Tambah Pengguna Baru'}</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-white">
                                <span className="material-icons-round">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Nama Lengkap</label>
                                <input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-gold focus:ring-1 focus:ring-gold outline-none"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">Email</label>
                                    <input
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-gold focus:ring-1 focus:ring-gold outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">NIS / NIP</label>
                                    <input
                                        name="nis"
                                        value={formData.nis}
                                        onChange={handleInputChange}
                                        className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-gold focus:ring-1 focus:ring-gold outline-none"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">Peran</label>
                                    <select
                                        name="role"
                                        value={formData.role}
                                        onChange={handleInputChange}
                                        className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-gold focus:ring-1 focus:ring-gold outline-none appearance-none"
                                    >
                                        <option value="santri">Santri</option>
                                        <option value="staff">Staff</option>
                                        <option value="admin">Admin</option>
                                        <option value="guest">Guest</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">Kategori / Jabatan</label>
                                    <input
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        placeholder="Contoh: Pengajar"
                                        className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-gold focus:ring-1 focus:ring-gold outline-none"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 rounded-lg text-gray-300 hover:bg-white/5 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={createUserMutation.isPending || updateUserMutation.isPending}
                                    className="px-6 py-2 rounded-lg bg-gold hover:bg-gold-light text-primary-dark font-bold transition-all disabled:opacity-50"
                                >
                                    {createUserMutation.isPending || updateUserMutation.isPending ? 'Menyimpan...' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// Helpers
function getRoleStyle(role) {
    switch (role) {
        case 'admin': return 'bg-red-500/10 text-red-400 border-red-500/20';
        case 'staff': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
        case 'santri': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
        default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
}

function getRoleDot(role) {
    switch (role) {
        case 'admin': return 'bg-red-400';
        case 'staff': return 'bg-purple-400';
        case 'santri': return 'bg-blue-400';
        default: return 'bg-gray-400';
    }
}

function getStatusStyle(status) {
    switch (status) {
        case 'active': return 'bg-green-500/10 text-green-400 border-green-500/10';
        case 'inactive': return 'bg-red-500/10 text-red-400 border-red-500/10';
        default: return 'bg-gray-500/10 text-gray-400 border-gray-500/10';
    }
}

export default DataSantri;
