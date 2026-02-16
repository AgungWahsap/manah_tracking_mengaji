import React from 'react';

const Header = ({ user, onMenuClick }) => {
    const userName = user?.name || 'Pengguna';

    // Format current date
    const today = new Date();
    const dateStr = today.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <header className="flex items-center justify-between px-8 py-6">
            <div className="flex items-center gap-4">
                {/* Mobile Menu Button */}
                <button
                    onClick={onMenuClick}
                    className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
                >
                    <span className="material-icons-round text-2xl">menu</span>
                </button>

                <div>
                    <h2 className="text-xl md:text-2xl font-bold text-white">Assalamu'alaikum, {userName}</h2>
                    <p className="text-sm text-gray-400 mt-1 flex items-center gap-2">
                        <span className="material-icons-round text-base text-accent-gold">calendar_today</span>
                        {dateStr}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <button
                    onClick={() => alert('Fitur notifikasi belum tersedia')}
                    className="relative p-2 text-gray-400 hover:text-white transition-colors"
                >
                    <span className="material-icons-round text-2xl">notifications</span>
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
            </div>
        </header>
    );
};

export default Header;
