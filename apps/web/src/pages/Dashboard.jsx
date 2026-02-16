import React from 'react';
import HeroSection from '../components/HeroSection';
import StatsSection from '../components/StatsSection';
import SunnahChecklist from '../components/SunnahChecklist';

const Dashboard = () => {
    // Note: Layout handles Sidebar and Header now.

    return (
        <div className="px-8 pb-8 space-y-6 pt-6">
            <HeroSection />

            {/* Sunnah Checklist Section */}
            <div className="grid grid-cols-1 gap-6">
                <SunnahChecklist />
            </div>

            <StatsSection />

            {/* Footer / Quote */}
            <div className="text-center py-6">
                <p className="text-sm text-gray-500 italic">"Barangsiapa yang menempuh jalan untuk mencari ilmu, maka Allah akan mudahkan baginya jalan menuju surga." (HR. Muslim)</p>
            </div>
        </div>
    );
};

export default Dashboard;
