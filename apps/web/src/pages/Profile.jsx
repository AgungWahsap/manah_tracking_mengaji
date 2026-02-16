import React, { useState, useEffect } from 'react';

import { useUserProfile, useUpdateProfile } from '../hooks/useUser';
import { useLogout } from '../hooks/useAuth'; // for logout

const Profile = () => {
    const logoutMutation = useLogout();
    const { data: userProfile, isLoading, isError } = useUserProfile();
    const updateProfileMutation = useUpdateProfile();

    const handleLogout = () => {
        logoutMutation.mutate();
    };

    const [isEditing, setIsEditing] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        waliName: '',
    });

    // Sync formData with fetched user profile
    useEffect(() => {
        if (userProfile) {
            setFormData({
                name: userProfile.name || '',
                phone: userProfile.phone || '',
                address: userProfile.address || '',
                waliName: userProfile.waliName || '',
            });
        }
    }, [userProfile]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSuccessMessage('');
        try {
            await updateProfileMutation.mutateAsync(formData);
            setIsEditing(false);
            setSuccessMessage('Profil berhasil diperbaharui!');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            console.error('Failed to update profile:', error);
            alert('Gagal memperbarui profil: ' + (error.message || 'Terjadi kesalahan'));
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setSuccessMessage('');
        // Reset form data
        if (userProfile) {
            setFormData({
                name: userProfile.name || '',
                phone: userProfile.phone || '',
                address: userProfile.address || '',
                waliName: userProfile.waliName || '',
            });
        }
    };

    const getInitials = (name) => {
        return name
            ? name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .substring(0, 2)
                .toUpperCase()
            : '??';
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-background-dark text-white">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-gray-400 text-sm">Memuat profil...</p>
                </div>
            </div>
        );
    }

    if (isError || !userProfile) {
        return (
            <div className="flex items-center justify-center h-screen bg-background-dark text-white">
                <div className="text-center">
                    <p className="text-red-400 mb-4">Gagal memuat profil user.</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
                    >
                        Coba Lagi
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 lg:p-12 fade-in">
            {/* Page Header */}
            <header className="flex justify-between items-center mb-10">
                <div>
                    <h2 className="text-3xl font-bold text-white capitalize">Profil {userProfile.role}</h2>
                    <p className="text-gray-400 mt-1">Kelola informasi pribadi dan keamanan akun Anda.</p>
                </div>
            </header>

            {/* Profile Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Identity Card */}
                <div className="lg:col-span-1">
                    <div className="glass-panel rounded-2xl p-8 flex flex-col items-center text-center h-full relative overflow-hidden group border border-glass-border shadow-lg">
                        {/* Decorative background glow for avatar */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-primary/20 rounded-full blur-3xl -z-10 group-hover:bg-primary/30 transition-all duration-500"></div>

                        {/* Avatar */}
                        <div className="relative w-32 h-32 mb-6">
                            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-emerald-800 p-1 shadow-lg shadow-primary/20">
                                <div className="w-full h-full rounded-full bg-[#1a2e28] flex items-center justify-center border-4 border-[#12201c] overflow-hidden">
                                    {userProfile.image ? (
                                        <img src={userProfile.image} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-emerald-200 to-emerald-500">
                                            {getInitials(userProfile.name)}
                                        </span>
                                    )}
                                </div>
                            </div>
                            {/* TODO: Implement Avatar Upload */}
                            {/* <button className="absolute bottom-0 right-0 w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white border-2 border-[#12201c] hover:bg-emerald-500 transition-colors cursor-pointer" title="Ubah Foto">
                                    <span className="material-symbols-outlined text-sm">edit</span>
                                </button> */}
                        </div>

                        <h3 className="text-2xl font-bold text-white mb-1">{userProfile.name}</h3>

                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-emerald-300 text-sm font-medium mb-6">
                            <span className="material-symbols-outlined text-xs">qr_code</span>
                            <span>NIS: {userProfile.nis || '-'}</span>
                        </div>

                        <div className="w-full border-t border-white/5 my-4"></div>

                        <div className="w-full space-y-3 mb-8">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-400">Status</span>
                                <span className="text-emerald-400 font-medium capitalize">{userProfile.status}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-400">Asrama</span>
                                <span className="text-white text-right">{userProfile.asramaName ? `${userProfile.asramaName} (Kamar ${userProfile.asramaRoom})` : '-'}</span>
                            </div>
                            {userProfile.role === 'santri' && (
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-400">Wali Santri</span>
                                    <span className="text-white">{userProfile.waliName || '-'}</span>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleLogout}
                            className="mt-auto w-full py-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-300 flex items-center justify-center gap-2 font-medium"
                        >
                            <span className="material-symbols-outlined text-lg">logout</span>
                            Keluar
                        </button>
                    </div>
                </div>

                {/* Right Column: Stats & Details */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Stats Row (Static/Placeholder for now) */}
                    {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> ... Same as before ... </div> */}

                    {/* Personal Info Section */}
                    <div className="glass-panel rounded-2xl p-6 md:p-8 border border-glass-border relative overflow-hidden">
                        {updateProfileMutation.isPending && (
                            <div className="absolute inset-0 bg-black/50 z-20 flex items-center justify-center backdrop-blur-sm">
                                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}

                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-xl">person_outline</span>
                                Informasi Pribadi
                            </h3>
                            {!isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="text-xs text-primary hover:text-emerald-400 font-medium uppercase tracking-wider transition-colors flex items-center gap-1"
                                >
                                    <span className="material-symbols-outlined text-sm">edit_square</span>
                                    Ubah Data
                                </button>
                            )}
                        </div>

                        {successMessage && (
                            <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-lg flex items-center gap-2 text-emerald-400 text-sm animate-fade-in">
                                <span className="material-symbols-outlined text-lg">check_circle</span>
                                {successMessage}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-500 uppercase tracking-wide">Nama Lengkap</label>
                                    <div className="flex items-center h-10 text-gray-400 border-b border-white/5 cursor-not-allowed" title="Tidak dapat diubah">{userProfile.name}</div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-500 uppercase tracking-wide">Nomor Induk Santri</label>
                                    <div className="flex items-center h-10 text-gray-400 border-b border-white/5 cursor-not-allowed" title="Tidak dapat diubah">{userProfile.nis || '-'}</div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-500 uppercase tracking-wide">Email</label>
                                    <div className="flex items-center h-10 text-gray-400 border-b border-white/5 cursor-not-allowed" title="Tidak dapat diubah">{userProfile.email}</div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-500 uppercase tracking-wide">Nomor Telepon</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white focus:ring-1 focus:ring-primary focus:border-primary transition-all text-sm"
                                        />
                                    ) : (
                                        <div className="flex items-center h-10 text-gray-200 border-b border-white/10">{userProfile.phone || '-'}</div>
                                    )}
                                </div>
                                <div className="space-y-1 md:col-span-2">
                                    <label className="text-xs text-gray-500 uppercase tracking-wide">Alamat Rumah</label>
                                    {isEditing ? (
                                        <textarea
                                            name="address"
                                            value={formData.address}
                                            onChange={handleInputChange}
                                            rows="2"
                                            className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white focus:ring-1 focus:ring-primary focus:border-primary transition-all text-sm resize-none"
                                        />
                                    ) : (
                                        <div className="flex items-center min-h-[40px] text-gray-200 border-b border-white/10">{userProfile.address || '-'}</div>
                                    )}
                                </div>

                                {userProfile.role === 'santri' && (
                                    <div className="space-y-1 md:col-span-2">
                                        <label className="text-xs text-gray-500 uppercase tracking-wide">Nama Wali</label>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                name="waliName"
                                                value={formData.waliName}
                                                onChange={handleInputChange}
                                                className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white focus:ring-1 focus:ring-primary focus:border-primary transition-all text-sm"
                                            />
                                        ) : (
                                            <div className="flex items-center h-10 text-gray-200 border-b border-white/10">{userProfile.waliName || '-'}</div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {isEditing && (
                                <div className="flex items-center justify-end gap-3 mt-8">
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        disabled={updateProfileMutation.isPending}
                                        className="px-4 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={updateProfileMutation.isPending}
                                        className="px-6 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white text-sm font-medium shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
                                    >
                                        {updateProfileMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
                                    </button>
                                </div>
                            )}
                        </form>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Profile;
