
const axios = require('axios');

async function check() {
    try {
        console.log('1. Logging in as Admin...');
        const loginRes = await axios.post('http://localhost:3001/api/auth/login/code', {
            code: 'M-ADMIN'
        });

        const token = loginRes.data.data.token;
        console.log('   ✅ Login success! Token:', token ? 'Found' : 'Missing');

        console.log('\n2. Fetching Prayer Times...');
        const prayerRes = await axios.get('http://localhost:3001/api/dashboard/prayer-times', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('   ✅ Status:', prayerRes.status);
        console.log('   ✅ Data Length:', prayerRes.data.data ? prayerRes.data.data.length : 0);
        console.log('   ✅ Data:', JSON.stringify(prayerRes.data.data || {}, null, 2));

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

check();
