import { db } from "../../db/index.js";
import { attendanceRecord, permit, sunnahRecord, activityLog } from "../../db/schema.js";

const resetAttendance = async () => {
    console.log("🧹 Starting Attendance History Cleanup for Go-Live...");

    try {
        // Delete all transactional data
        // Order shouldn't matter too much if there are no strict dependencies between them, 
        // but permits might rely on prayerTime (master) and user (master).

        console.log("... Deleting Attendance Records");
        const att = await db.delete(attendanceRecord).returning({ id: attendanceRecord.id });

        console.log("... Deleting Permits");
        const prm = await db.delete(permit).returning({ id: permit.id });

        console.log("... Deleting Sunnah Records");
        const sun = await db.delete(sunnahRecord).returning({ id: sunnahRecord.id });

        // Optional: Activity Log
        console.log("... Deleting Activity Logs");
        const logs = await db.delete(activityLog).returning({ id: activityLog.id });

        console.log("------------------------------------------------");
        console.log(`✅ Cleanup Complete.`);
        console.log(`Removed:`);
        console.log(`- ${att.length} Attendance Records`);
        console.log(`- ${prm.length} Permits`);
        console.log(`- ${sun.length} Sunnah Records`);
        console.log(`- ${logs.length} Activity Logs`);
        console.log("------------------------------------------------");
        console.log("The database is now clean for fresh usage. User accounts are preserved.");

        process.exit(0);

    } catch (error) {
        console.error("❌ Cleanup failed:", error);
        process.exit(1);
    }
};

resetAttendance();
