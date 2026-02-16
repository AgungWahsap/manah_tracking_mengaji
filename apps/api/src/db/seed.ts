import db from "./index.js";
import * as schema from "./schema.js";
import "dotenv/config";

/**
 * Seed the database with initial data:
 * - 5 prayer times with default offsets
 * - Default system settings
 * - 3 asrama (dorms)
 * - 1 admin user + access code
 */
async function seed() {
    console.log("🌱 Seeding database...\n");

    try {
        // 1. Seed Prayer Times
        console.log("⏰ Seeding prayer times...");
        const prayerTimes = [
            { name: "subuh", scheduledTime: "04:30", offsetMinutes: 15 },
            { name: "dzuhur", scheduledTime: "12:15", offsetMinutes: 10 },
            { name: "ashar", scheduledTime: "15:30", offsetMinutes: 10 },
            { name: "maghrib", scheduledTime: "18:00", offsetMinutes: 15 },
            { name: "isya", scheduledTime: "19:30", offsetMinutes: 15 },
        ];

        for (const pt of prayerTimes) {
            await db
                .insert(schema.prayerTime)
                .values(pt)
                .onConflictDoNothing({ target: schema.prayerTime.name });
        }
        console.log("  ✅ Prayer times seeded");

        // 2. Seed System Settings
        console.log("⚙️  Seeding system settings...");
        const settings = [
            {
                key: "bind_device",
                value: "true",
                description: "Bind user sessions to a single device",
            },
            {
                key: "geofencing",
                value: "true",
                description: "Require check-in within geofence radius",
            },
            {
                key: "dynamic_qr",
                value: "true",
                description: "Generate dynamic QR codes for attendance",
            },
            {
                key: "selfie_required",
                value: "false",
                description: "Require selfie during attendance check-in",
            },
            {
                key: "geofence_radius",
                value: "100",
                description: "Geofence radius in meters",
            },
        ];

        for (const s of settings) {
            await db
                .insert(schema.systemSettings)
                .values(s)
                .onConflictDoNothing({ target: schema.systemSettings.key });
        }
        console.log("  ✅ System settings seeded");

        // 3. Seed Asrama
        console.log("🏠 Seeding asrama...");
        const asramaList = [
            { name: "Al-Farabi", roomNumber: "101" },
            { name: "Al-Ghazali", roomNumber: "201" },
            { name: "Ibn Sina", roomNumber: "301" },
        ];

        for (const a of asramaList) {
            await db
                .insert(schema.asrama)
                .values(a)
                .onConflictDoNothing();
        }
        console.log("  ✅ Asrama seeded");

        // 4. Seed Admin User
        console.log("👤 Seeding admin user...");
        const adminId = crypto.randomUUID();
        await db
            .insert(schema.user)
            .values({
                id: adminId,
                name: "Admin Pesantren",
                email: "admin@manahtracking.com",
                role: "admin",
                status: "active",
            })
            .onConflictDoNothing();
        console.log("  ✅ Admin user seeded");

        // 5. Seed admin access code
        console.log("🔑 Seeding admin access code...");
        await db
            .insert(schema.accessCode)
            .values({
                code: "M-ADMIN",
                userId: adminId,
                status: "active",
            })
            .onConflictDoNothing({ target: schema.accessCode.code });
        console.log("  ✅ Admin access code seeded (code: M-ADMIN)");

        console.log("\n✅ Database seeded successfully!");
    } catch (error) {
        console.error("❌ Seed failed:", error);
    }

    process.exit(0);
}

seed();
