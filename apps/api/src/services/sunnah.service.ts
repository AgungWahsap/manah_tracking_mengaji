import { db } from "../db/index.js";
import * as schema from "../db/schema.js";
import { eq, and, desc, asc, count, gte, lte } from "drizzle-orm";

export const sunnahService = {
    /**
     * Submit or Toggle a Sunnah Practice
     * If already exists for today, toggle 'performed' or just ensured it exists.
     * The requirement says "Checklist", implying toggle behavior or strictly "Present".
     * Let's assume unique constraint on (userId, date, practice).
     * If exists, update. If not, insert.
     */
    async submitSunnah(data: { userId: string; date: string; practice: string; performed: boolean }) {
        const { userId, date, practice, performed } = data;

        // Check if record exists
        const existing = await db
            .select()
            .from(schema.sunnahRecord)
            .where(and(
                eq(schema.sunnahRecord.userId, userId),
                eq(schema.sunnahRecord.date, date),
                eq(schema.sunnahRecord.practice, practice as any)
            ))
            .limit(1);

        if (existing.length > 0) {
            // Update
            const [updated] = await db
                .update(schema.sunnahRecord)
                .set({ performed })
                .where(eq(schema.sunnahRecord.id, existing[0].id))
                .returning();
            return updated;
        } else {
            // Insert
            const [record] = await db
                .insert(schema.sunnahRecord)
                .values({
                    userId,
                    date,
                    practice: practice as any,
                    performed
                })
                .returning();
            return record;
        }
    },

    /**
     * Get User's Sunnah Practices for specific date (defaults to today)
     */
    async getUserSunnah(userId: string, date: string) {
        const records = await db
            .select()
            .from(schema.sunnahRecord)
            .where(and(
                eq(schema.sunnahRecord.userId, userId),
                eq(schema.sunnahRecord.date, date),
                eq(schema.sunnahRecord.performed, true) // Only return performed ones? Or all? Frontend needs state.
                // Let's return all records for that day.
            ));

        return records;
    },

    /**
     * (Admin) Get Sunnah Report
     * Similar to attendance report, but for sunnah practices.
     */
    async getReport(query: { startDate: string; endDate: string; role?: string }) {
        // Simple aggregation: Count of each practice per user in the period
        const { startDate, endDate, role } = query;

        // 1. Get Users
        const whereConditions = [eq(schema.user.status, 'active')];
        if (role && role !== 'Semua Status') {
            whereConditions.push(eq(schema.user.role, role as any));
        }

        const users = await db
            .select()
            .from(schema.user)
            .where(and(...whereConditions))
            .orderBy(asc(schema.user.name));

        // 2. Get Sunnah Records
        const records = await db
            .select()
            .from(schema.sunnahRecord)
            .where(and(
                gte(schema.sunnahRecord.date, startDate),
                lte(schema.sunnahRecord.date, endDate),
                eq(schema.sunnahRecord.performed, true)
            ));

        // 3. Map
        const report = users.map(user => {
            const userRecords = records.filter(r => r.userId === user.id);
            const stats: Record<string, number> = {};

            // Initialize all enum values to 0? Or just return what's there?
            // Let's count what's there.
            userRecords.forEach(r => {
                const p = r.practice;
                stats[p] = (stats[p] || 0) + 1;
            });

            return {
                user: { id: user.id, name: user.name, role: user.role, nis: user.nis },
                stats
            };
        });

        return { data: report };
    }
};
