import React, { useState, useEffect } from 'react';
import sunnahService from '../services/sunnah.service';

const practices = [
    { id: 'tahajud', label: 'Tahajud', category: 'Utama' },
    { id: 'dhuha', label: 'Dhuha', category: 'Utama' },
    { id: 'witir', label: 'Witir', category: 'Utama' },
    { id: 'qobliyah_subuh', label: 'Qobliyah Subuh', category: 'Rawatib' },
    { id: 'qobliyah_dzuhur', label: 'Qobliyah Dzuhur', category: 'Rawatib' },
    { id: 'badiyah_dzuhur', label: 'Ba\'diyah Dzuhur', category: 'Rawatib' },
    { id: 'qobliyah_ashar', label: 'Qobliyah Ashar', category: 'Rawatib' },
    { id: 'qobliyah_maghrib', label: 'Qobliyah Maghrib', category: 'Rawatib' },
    { id: 'badiyah_maghrib', label: 'Ba\'diyah Maghrib', category: 'Rawatib' },
    { id: 'qobliyah_isya', label: 'Qobliyah Isya', category: 'Rawatib' },
    { id: 'badiyah_isya', label: 'Ba\'diyah Isya', category: 'Rawatib' }
];

const SunnahChecklist = () => {
    const [performed, setPerformed] = useState({});
    const [originalPerformed, setOriginalPerformed] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchTodaySunnah();
    }, []);

    const fetchTodaySunnah = async () => {
        try {
            const response = await sunnahService.getTodaySunnah();
            if (response.success && response.data) {
                const map = {};
                response.data.forEach(r => {
                    if (r.performed) map[r.practice] = true;
                });
                setPerformed(map);
                setOriginalPerformed(map);
            }
        } catch (error) {
            console.error("Failed to load sunnah practices", error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (practiceId) => {
        setPerformed(prev => ({ ...prev, [practiceId]: !prev[practiceId] }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Find changed items
            const promises = [];
            practices.forEach(p => {
                // If value changed from original
                if (!!performed[p.id] !== !!originalPerformed[p.id]) {
                    promises.push(sunnahService.submitSunnah({
                        practice: p.id,
                        performed: !!performed[p.id]
                    }));
                }
            });

            await Promise.all(promises);
            setOriginalPerformed({ ...performed }); // Update original to current
            alert("Data berhasil disimpan.");
        } catch (error) {
            console.error("Failed to save", error);
            alert("Gagal menyimpan data.");
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setPerformed({ ...originalPerformed });
    };

    // Check if dirty
    const isDirty = practices.some(p => !!performed[p.id] !== !!originalPerformed[p.id]);

    const categories = ['Utama', 'Rawatib'];

    return (
        <div className="glass-panel rounded-2xl p-6 h-full">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-semibold flex items-center gap-2">
                    <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
                    Laporan Amalan Sunnah
                </h3>
                {isDirty && (
                    <div className="flex gap-2">
                        <button
                            onClick={handleCancel}
                            disabled={saving}
                            className="px-3 py-1 text-xs rounded border border-white/20 text-gray-300 hover:bg-white/5"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-3 py-1 text-xs rounded bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
                        >
                            {saving ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="text-center text-gray-500 py-8">Memuat...</div>
            ) : (
                <div className="space-y-6">
                    {categories.map(category => (
                        <div key={category}>
                            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 pl-1">{category}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {practices.filter(p => p.category === category).map(p => (
                                    <label
                                        key={p.id}
                                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${performed[p.id]
                                                ? 'bg-purple-500/20 border-purple-500/50'
                                                : 'bg-white/5 border-white/5 hover:bg-white/10'
                                            }`}
                                    >
                                        <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${performed[p.id] ? 'bg-purple-500 border-purple-500' : 'border-gray-500'
                                            }`}>
                                            {performed[p.id] && <span className="material-icons-round text-white text-sm">check</span>}
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={!!performed[p.id]}
                                            onChange={() => handleToggle(p.id)}
                                        />
                                        <span className={`text-sm font-medium ${performed[p.id] ? 'text-white' : 'text-gray-400'}`}>
                                            {p.label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SunnahChecklist;
