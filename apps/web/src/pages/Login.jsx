import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLoginWithCode } from '../hooks/useAuth';

const Login = () => {
    const [code, setCode] = React.useState('');
    const navigate = useNavigate();
    const loginMutation = useLoginWithCode();

    const handleSubmit = async (e) => {
        e.preventDefault();

        loginMutation.mutate(code, {
            onSuccess: (data) => {
                const user = data?.user;
                if (user?.role === 'admin' || user?.role === 'superadmin') {
                    navigate('/global-recap');
                } else {
                    navigate('/');
                }
            },
        });
    };

    return (
        <div className="font-display bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100 min-h-screen flex items-center justify-center geo-bg relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                <div className="absolute -top-20 -left-20 w-96 h-96 bg-primary/30 rounded-full blur-3xl opacity-40"></div>
                <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl opacity-30"></div>
            </div>

            {/* Main Container */}
            <main className="w-full max-w-md px-6 relative z-10">
                {/* Glassmorphism Card */}
                <div className="glass-panel rounded-xl p-8 md:p-10 border-t border-white/10">
                    {/* Logo Section */}
                    <div className="flex flex-col items-center justify-center mb-10">
                        <div className="w-24 h-24 mb-6 rounded-full bg-white/5 flex items-center justify-center border border-gold-500/20 shadow-[0_0_25px_rgba(212,175,55,0.15)] backdrop-blur-sm relative p-3 group">
                            <img src="/logo-pesantren.png" alt="Logo Manah Tracking" className="w-full h-full object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300" />
                            <div className="absolute inset-0 rounded-full border border-white/5 animate-pulse"></div>
                        </div>
                        <h1 className="text-3xl font-bold text-white tracking-tight mb-1 text-center">
                            Manah Tracking
                        </h1>
                        <p className="text-gray-400 text-sm font-light tracking-wide uppercase text-center">
                            Absensi Berjamaah
                        </p>
                    </div>

                    {/* Login Form */}
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="relative group">
                            <label className="block text-xs font-medium text-gold-400 mb-2 ml-1 uppercase tracking-wider" htmlFor="unique_code">
                                Kode Unik
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="material-icons-round text-gray-400 group-focus-within:text-gold-400 transition-colors duration-300">qr_code_2</span>
                                </div>
                                <input
                                    autoComplete="off"
                                    className="block w-full pl-10 pr-3 py-3.5 bg-black/20 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gold-500/50 focus:border-gold-500 transition-all duration-300 sm:text-sm font-display tracking-widest text-center"
                                    id="unique_code"
                                    name="unique_code"
                                    placeholder="M - X X X X"
                                    type="text"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    disabled={loginMutation.isPending}
                                />
                                <div className="absolute inset-0 rounded-lg bg-gold-500/5 opacity-0 group-focus-within:opacity-100 pointer-events-none transition-opacity duration-300"></div>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                disabled={loginMutation.isPending}
                                className={`w-full flex justify-center py-3.5 px-4 border border-transparent rounded-lg shadow-lg text-sm font-bold text-primary-900 bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 focus:ring-offset-gray-900 gold-gradient-btn uppercase tracking-wider ${loginMutation.isPending ? 'opacity-75 cursor-not-allowed' : ''}`}
                                type="submit"
                            >
                                <span className="text-[#0A1F1A]">{loginMutation.isPending ? 'Memproses...' : 'Masuk'}</span>
                            </button>
                            {loginMutation.isError && <p className="mt-2 text-center text-red-500 text-sm">{loginMutation.error?.message || 'Kode unik salah atau tidak ditemukan.'}</p>}
                        </div>
                    </form>

                    {/* Footer Links */}
                    <div className="mt-8 pt-6 border-t border-white/5 text-center">
                        <a
                            href="https://wa.me/6283843207900?text=Assalamu'alaikum%20Admin%2C%20saya%20butuh%20bantuan%20untuk%20login%20di%20aplikasi%20Manah%20Tracking"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-300 group border border-transparent hover:border-white/10 hover:shadow-lg active:scale-95"
                        >
                            <span className="material-icons-round text-xl text-gold-400/80 group-hover:text-gold-400 group-hover:animate-bounce transition-colors">support_agent</span>
                            Butuh bantuan? Hubungi Admin
                        </a>
                    </div>
                </div>

                {/* Copyright */}
                <div className="mt-8 text-center">
                    <p className="text-xs text-white/20">
                        © 2023 Manah Tracking System. <br />Design for Umat.
                    </p>
                </div>
            </main>
        </div>
    );
};

export default Login;
