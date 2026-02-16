import db from "../db/index.js";
import * as schema from "../db/schema.js";
import { eq, and, gte, lte, sql, desc, count } from "drizzle-orm";

export const dashboardService = {
    /**
     * Get all prayer times with offset settings
     */
    async getPrayerTimes() {
        const prayerTimes = await db
            .select()
            .from(schema.prayerTime)
            .orderBy(schema.prayerTime.scheduledTime);

        return prayerTimes;
    },

    /**
     * Get weekly attendance stats for a specific user
     */
    async getWeeklyStats(userId: string) {
        const today = new Date();
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);

        const todayStr = today.toISOString().split("T")[0];
        const weekAgoStr = weekAgo.toISOString().split("T")[0];

        // Total attendance records for this week
        const records = await db
            .select({
                status: schema.attendanceRecord.status,
                total: count(),
            })
            .from(schema.attendanceRecord)
            .where(
                and(
                    eq(schema.attendanceRecord.userId, userId),
                    gte(schema.attendanceRecord.date, weekAgoStr),
                    lte(schema.attendanceRecord.date, todayStr)
                )
            )
            .groupBy(schema.attendanceRecord.status);

        const stats = {
            present: 0,
            late: 0,
            absent: 0,
            excused: 0,
            total: 0,
            percentage: 0,
        };

        for (const record of records) {
            const statusKey = record.status as keyof typeof stats;
            if (statusKey in stats && statusKey !== "total" && statusKey !== "percentage") {
                stats[statusKey] = Number(record.total);
            }
            stats.total += Number(record.total);
        }

        // Calculate attendance percentage (present + late = attended)
        if (stats.total > 0) {
            stats.percentage = Math.round(
                ((stats.present + stats.late) / stats.total) * 100
            );
        }

        return stats;
    },

    /**
     * Get recent activity for a specific user
     */
    async getRecentActivity(userId: string, limit: number = 5) {
        const activities = await db
            .select()
            .from(schema.activityLog)
            .where(eq(schema.activityLog.userId, userId))
            .orderBy(desc(schema.activityLog.createdAt))
            .limit(limit);

        return activities;
    },

    /**
     * Update prayer time offsets
     */
    async updatePrayerTimes(updates: Record<string, { offset: number; time: string }>) {
        const updatePromises = [];
        for (const [name, data] of Object.entries(updates)) {
            updatePromises.push(
                db
                    .update(schema.prayerTime)
                    .set({
                        offsetMinutes: data.offset,
                        scheduledTime: data.time
                    })
                    .where(eq(schema.prayerTime.name, name))
            );
        }
        await Promise.all(updatePromises);
        return { success: true };
    },
};
