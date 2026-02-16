import db from "../db/index.js";
import * as schema from "../db/schema.js";
import { eq, sql } from "drizzle-orm";

interface PrayerOffsets {
    subuh: number;
    dzuhur: number;
    ashar: number;
    maghrib: number;
    isya: number;
}

interface SystemToggle {
    key: string;
    value: string;
}

export const settingsService = {
    /**
     * Get all system settings
     */
    async getAll() {
        const settings = await db.select().from(schema.systemSettings);

        // Convert array to key-value object
        const settingsMap: Record<string, string> = {};
        for (const s of settings) {
            settingsMap[s.key] = s.value;
        }

        return settingsMap;
    },

    /**
     * (Admin) Update multiple system settings at once
     */
    async updateAll(settings: SystemToggle[], updatedBy: string) {
        const results = [];

        for (const setting of settings) {
            const [existing] = await db
                .select()
                .from(schema.systemSettings)
                .where(eq(schema.systemSettings.key, setting.key))
                .limit(1);

            if (existing) {
                const [updated] = await db
                    .update(schema.systemSettings)
                    .set({
                        value: setting.value,
                        updatedAt: new Date(),
                        updatedBy,
                    })
                    .where(eq(schema.systemSettings.key, setting.key))
                    .returning();
                results.push(updated);
            } else {
                const [created] = await db
                    .insert(schema.systemSettings)
                    .values({
                        key: setting.key,
                        value: setting.value,
                        updatedBy,
                    })
                    .returning();
                results.push(created);
            }
        }

        return results;
    },

    /**
     * Get prayer time offsets
     */
    async getPrayerOffsets(): Promise<PrayerOffsets> {
        const prayerTimes = await db.select().from(schema.prayerTime);

        const offsets: PrayerOffsets = {
            subuh: 15,
            dzuhur: 10,
            ashar: 10,
            maghrib: 15,
            isya: 15,
        };

        for (const prayer of prayerTimes) {
            const key = prayer.name as keyof PrayerOffsets;
            if (key in offsets) {
                offsets[key] = prayer.offsetMinutes;
            }
        }

        return offsets;
    },

    /**
     * (Admin) Update prayer time offsets
     */
    async updatePrayerOffsets(offsets: PrayerOffsets) {
        const results = [];

        for (const [name, offset] of Object.entries(offsets)) {
            const [updated] = await db
                .update(schema.prayerTime)
                .set({
                    offsetMinutes: offset,
                    updatedAt: new Date(),
                })
                .where(eq(schema.prayerTime.name, name))
                .returning();

            if (updated) {
                results.push(updated);
            }
        }

        return results;
    },

    /**
     * (Admin) Danger: Reset all attendance records for today
     */
    async resetDailyAttendance() {
        const today = new Date().toISOString().split("T")[0];

        const result = await db
            .delete(schema.attendanceRecord)
            .where(eq(schema.attendanceRecord.date, today))
            .returning();

        return { deletedCount: result.length, date: today };
    },

    /**
     * (Admin) Danger: Unbind all user devices
     */
    async unbindAllDevices() {
        const result = await db
            .update(schema.user)
            .set({ deviceId: null, updatedAt: new Date() })
            .where(sql`${schema.user.deviceId} IS NOT NULL`)
            .returning();

        return { unboundCount: result.length };
    },
};
