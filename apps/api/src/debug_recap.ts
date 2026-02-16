import { db } from './db/index.js';
import * as schema from './db/schema.js';
import { attendanceService } from './services/attendance.service.js';

import * as fs from 'fs';
import * as path from 'path';

const logFile = path.join(process.cwd(), 'src', 'debug_output.txt');

function log(message: any) {
    const str = typeof message === 'string' ? message : JSON.stringify(message, null, 2);
    fs.appendFileSync(logFile, str + '\n');
}

async function run() {
    fs.writeFileSync(logFile, '--- START ---\n');

    log('--- Checking Prayer Times ---');
    const prayers = await db.select().from(schema.prayerTime);
    log(prayers);

    try {
        log('\n--- Checking Users ---');
        const users = await db.select().from(schema.user).limit(5);
        log(users);
    } catch (e) {
        log('Error fetching users: ' + e);
    }

    try {
        log('\n--- Checking Global Recap ---');
        const recap = await attendanceService.getGlobalRecap({
            page: 1,
            limit: 10,
            date: new Date().toISOString().split('T')[0],
            role: 'Semua Status'
        });
        log('Recap Keys: ' + Object.keys(recap));
        log('Recap Data Length: ' + recap.data?.length);
        if (recap.data?.length > 0) {
            log('First Row Sample:');
            log(recap.data[0]);
        }
        log('Prayer Times in Recap:');
        log(recap.prayerTimes);
    } catch (e: any) {
        log('Error fetching recap: ' + (e.message || e));
        if (e.stack) log(e.stack);
    }

    process.exit(0);
}

run().catch(e => {
    console.error('Fatal Error:', e);
    process.exit(1);
});
