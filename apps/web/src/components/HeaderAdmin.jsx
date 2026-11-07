import React from 'react';

const HeaderAdmin = ({ onMenuClick, title = 'Absensi Mengaji' }) => (
    <header className="z-10 mx-4 mb-0 flex h-20 items-center justify-between rounded-xl border-b border-glass-border glass-panel px-5 md:px-8">
        <div className="flex items-center gap-4">
            <button
                type="button"
                onClick={onMenuClick}
                className="p-2 text-gray-400 transition-colors hover:text-white md:hidden"
                aria-label="Buka menu"
            >
                <span className="material-icons-round text-2xl">menu</span>
            </button>
            <h2 className="text-xl font-bold tracking-tight text-white md:text-2xl">{title}</h2>
        </div>
    </header>
);

export default HeaderAdmin;
