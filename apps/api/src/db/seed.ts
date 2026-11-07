import db from "./index.js";
import * as schema from "./schema.js";
import { and, eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import "dotenv/config";

/**
 * Seed the database with initial data:
 * - 4 recitation session schedules
 * - 1 admin user + access code
 */
async function seed() {
    console.log("🌱 Seeding database...\n");

    try {
        console.log("📖 Seeding recitation sessions...");
        const recitationSessions = [
            { name: "subuh", scheduledTime: "04:30" },
            { name: "dzuhur", scheduledTime: "12:00" },
            { name: "ashar", scheduledTime: "15:30" },
            { name: "isya", scheduledTime: "19:30" },
        ];

        for (const session of recitationSessions) {
            await db
                .insert(schema.recitationSession)
                .values(session)
                .onConflictDoNothing({ target: schema.recitationSession.name });
        }
        console.log("  ✅ Recitation sessions seeded");

        // 2. Seed Admin User
        console.log("👤 Seeding admin user...");
        let [admin] = await db
            .insert(schema.user)
            .values({
                id: randomBytes(16).toString("hex"),
                name: "Admin Pesantren",
                email: "admin@manahtracking.com",
                role: "admin",
                status: "active",
            })
            .onConflictDoNothing()
            .returning();
        if (!admin) {
            [admin] = await db
                .select()
                .from(schema.user)
                .where(eq(schema.user.email, "admin@manahtracking.com"))
                .limit(1);
        }
        if (!admin) {
            throw new Error("Could not load or create the seed admin user");
        }
        console.log("  ✅ Admin user seeded");

        // 3. Seed admin access code
        console.log("🔑 Seeding admin access code...");
        const [existingAdminCode] = await db
            .select()
            .from(schema.accessCode)
            .where(and(
                eq(schema.accessCode.userId, admin.id),
                eq(schema.accessCode.status, "active"),
            ))
            .limit(1);
        if (!existingAdminCode) {
            const code = `M-${randomBytes(6).toString("hex").toUpperCase()}`;
            await db
                .insert(schema.accessCode)
                .values({
                    code,
                    userId: admin.id,
                    status: "active",
                })
                .onConflictDoNothing({ target: schema.accessCode.code });
            console.log(`  ✅ Admin access code created: ${code}`);
        } else {
            console.log("  ✅ Admin access code already exists");
        }

        console.log("\n✅ Database seeded successfully!");
    } catch (error) {
        console.error("❌ Seed failed:", error);
        process.exit(1);
    }

    process.exit(0);
}

seed();
