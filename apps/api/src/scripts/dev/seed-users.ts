import { db } from "../../db/index.js";
import { user, attendanceRecord, prayerTime, accessCode } from "../../db/schema.js";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";

const USERS_TO_CREATE = 50;
const DAYS_OF_HISTORY = 3;

// Helper to generate random status based on user request (No LATE, mostly PRESENT, some ABSENT/EXCUSED)
const getRandomStatus = () => {
    const rand = Math.random();
    if (rand < 0.8) return 'present';
    if (rand < 0.9) return 'excused'; // 10% excused
    return 'absent'; // 10% absent (alfa) - replaces 'late'
};

const seedUsers = async () => {
    console.log("🌱 Starting User Seed...");

    try {
        // 1. Get or Create Prayer Times
        let prayerTimes = await db.select().from(prayerTime);
        if (prayerTimes.length === 0) {
            console.log("Creating default prayer times...");
            const defaultPrayers = [
                { name: "subuh", scheduledTime: "04:30:00" },
                { name: "dzuhur", scheduledTime: "12:00:00" },
                { name: "ashar", scheduledTime: "15:15:00" },
                { name: "maghrib", scheduledTime: "18:00:00" },
                { name: "isya", scheduledTime: "19:15:00" },
            ];
            await db.insert(prayerTime).values(defaultPrayers);
            prayerTimes = await db.select().from(prayerTime);
        }

        // 2. Create Users
        const usersData = [];
        const accessCodesData = [];

        console.log(`Generating ${USERS_TO_CREATE} users...`);

        for (let i = 1; i <= USERS_TO_CREATE; i++) {
            const userId = nanoid();
            usersData.push({
                id: userId,
                name: `Santri ${i}`,
                email: `santri${i}@manah.com`,
                role: 'santri' as const,
                status: 'active' as const,
                nis: `2024${i.toString().padStart(4, '0')}`, // 20240001, etc.
                password: 'password123', // Note: In real app this should be hashed, but for dummy data it's fine if auth allows or if we just verify existence
            } as any);

            // generate access code
            accessCodesData.push({
                code: `CODE-${i.toString().padStart(3, '0')}`,
                userId: userId,
                status: 'active' as const
            } as any);
        }

        // Batch insert users
        // Drizzle might not support massive batch inserts depending on driver, but 50 is small.
        for (const u of usersData) {
            // Check if exists by email to avoid unique constraint error on re-run
            const existing = await db.select().from(user).where(eq(user.email, u.email));
            if (existing.length === 0) {
                await db.insert(user).values(u);
            }
        }

        // Insert access codes
        for (const ac of accessCodesData) {
            const existing = await db.select().from(accessCode).where(eq(accessCode.code, ac.code));
            if (existing.length === 0) {
                await db.insert(accessCode).values(ac);
            }
        }

        console.log("✅ Users created.");

        // 3. Create Attendance History
        console.log(`Generating attendance for last ${DAYS_OF_HISTORY} days...`);
        const attendanceData = [];
        const today = new Date();

        // Get updated user list to ensure we have IDs
        const allUsers = await db.select().from(user).where(eq(user.role, 'santri')); // Filter just in case

        for (let d = 0; d < DAYS_OF_HISTORY; d++) {
            const date = new Date(today);
            date.setDate(date.getDate() - d);
            const dateStr = date.toISOString().split('T')[0];

            for (const u of allUsers) {
                // Determine if user was present this day effectively (simplified logic)
                for (const pt of prayerTimes) {
                    const status = getRandomStatus();

                    // If absent, we might not create a record OR create one with status 'absent'.
                    // System usually expects a record for 'absent' if we want to track it explicitly, 
                    // or missing record implies absent. Let's create explicit 'absent' records for clarity in reports.

                    attendanceData.push({
                        userId: u.id,
                        prayerTimeId: pt.id,
                        date: dateStr,
                        status: status, // present, excused, absent
                        method: status === 'present' ? 'qr_code' : null,
                        checkInTime: status === 'present' ? pt.scheduledTime : null, // Perfect attendance times for dummy data
                        source: 'ADMIN' // marked as generated
                    } as any);
                }
            }
        }

        // Batch insert attendance (might be large, let's chunk it)
        const CHUNK_SIZE = 100;
        for (let i = 0; i < attendanceData.length; i += CHUNK_SIZE) {
            const chunk = attendanceData.slice(i, i + CHUNK_SIZE);
            await db.insert(attendanceRecord).values(chunk);
            console.log(`Checking in... chunk ${i / CHUNK_SIZE + 1}`);
        }

        console.log(`✅ Seed complete! Inserted ${attendanceData.length} attendance records.`);
        process.exit(0);

    } catch (error) {
        console.error("❌ Seed failed:", error);
        process.exit(1);
    }
};

seedUsers();
