import { and, asc, count, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import db from "../db/index.js";
import * as schema from "../db/schema.js";

const SESSION_NAMES = ["subuh", "dzuhur", "ashar", "isya"] as const;
type SessionName = (typeof SESSION_NAMES)[number];
type AttendanceCode = "H" | "S" | "I" | "A";

export const recitationService = {
    async getSessions() {
        return db
            .select()
            .from(schema.recitationSession)
            .orderBy(asc(schema.recitationSession.scheduledTime));
    },

    async updateSessions(updates: Record<SessionName, string>) {
        const now = new Date();
        await db.transaction(async (tx) => {
            for (const name of SESSION_NAMES) {
                await tx
                    .insert(schema.recitationSession)
                    .values({ name, scheduledTime: updates[name], updatedAt: now })
                    .onConflictDoUpdate({
                        target: schema.recitationSession.name,
                        set: { scheduledTime: updates[name], updatedAt: now },
                    });
            }
        });

        return this.getSessions();
    },

    async listStudents(search?: string, includeInactive = false) {
        const conditions = [];
        if (!includeInactive) {
            conditions.push(eq(schema.recitationStudent.isActive, true));
        }
        if (search?.trim()) {
            conditions.push(
                or(
                    ilike(schema.recitationStudent.name, `%${search.trim()}%`),
                    ilike(schema.recitationStudent.nis, `%${search.trim()}%`),
                )!,
            );
        }

        return db
            .select()
            .from(schema.recitationStudent)
            .where(conditions.length ? and(...conditions) : undefined)
            .orderBy(asc(schema.recitationStudent.name));
    },

    async createStudent(data: { name: string; nis?: string | null }) {
        const [student] = await db
            .insert(schema.recitationStudent)
            .values({ name: data.name, nis: data.nis || null })
            .returning();
        return student;
    },

    async updateStudent(id: string, data: { name?: string; nis?: string | null; isActive?: boolean }) {
        const [student] = await db
            .update(schema.recitationStudent)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(schema.recitationStudent.id, id))
            .returning();

        if (!student) {
            throw new Error("Santri tidak ditemukan");
        }
        return student;
    },

    async getSessionAttendance(date: string, sessionId: string) {
        const students = await db
            .select({
                id: schema.recitationStudent.id,
                name: schema.recitationStudent.name,
                nis: schema.recitationStudent.nis,
                status: schema.recitationAttendance.status,
            })
            .from(schema.recitationStudent)
            .leftJoin(
                schema.recitationAttendance,
                and(
                    eq(schema.recitationAttendance.studentId, schema.recitationStudent.id),
                    eq(schema.recitationAttendance.date, date),
                    eq(schema.recitationAttendance.sessionId, sessionId),
                ),
            )
            .where(eq(schema.recitationStudent.isActive, true))
            .orderBy(asc(schema.recitationStudent.name));

        return students;
    },

    async saveSessionAttendance(
        adminId: string,
        data: { date: string; sessionId: string; attendance: { studentId: string; status: AttendanceCode }[] },
    ) {
        const activeStudents = await db
            .select({ id: schema.recitationStudent.id })
            .from(schema.recitationStudent)
            .where(eq(schema.recitationStudent.isActive, true));
        const activeStudentIds = new Set(activeStudents.map((student) => student.id));
        const submitted = new Map<string, AttendanceCode>();

        for (const item of data.attendance) {
            if (!activeStudentIds.has(item.studentId)) {
                throw new Error("Daftar santri berubah. Muat ulang sebelum menyimpan.");
            }
            if (submitted.has(item.studentId)) {
                throw new Error("Status santri tercantum lebih dari satu kali");
            }
            submitted.set(item.studentId, item.status);
        }

        const now = new Date();
        const rows = activeStudents.map((student) => ({
            studentId: student.id,
            sessionId: data.sessionId,
            date: data.date,
            status: submitted.get(student.id) ?? "A" as AttendanceCode,
            recordedBy: adminId,
            updatedAt: now,
        }));

        if (rows.length === 0) {
            throw new Error("Belum ada santri aktif untuk diabsen");
        }

        await db.transaction(async (tx) => {
            await tx
                .insert(schema.recitationAttendance)
                .values(rows)
                .onConflictDoUpdate({
                    target: [
                        schema.recitationAttendance.studentId,
                        schema.recitationAttendance.sessionId,
                        schema.recitationAttendance.date,
                    ],
                    set: {
                        status: sql`excluded.status`,
                        recordedBy: adminId,
                        updatedAt: now,
                    },
                });
        });

        return { savedCount: rows.length, date: data.date, sessionId: data.sessionId };
    },

    async getRecap(startDate: string, endDate: string, sessionId?: string) {
        const conditions = [
            gte(schema.recitationAttendance.date, startDate),
            lte(schema.recitationAttendance.date, endDate),
        ];
        if (sessionId) {
            conditions.push(eq(schema.recitationAttendance.sessionId, sessionId));
        }

        const [totalResult] = await db
            .select({ total: count() })
            .from(schema.recitationAttendance)
            .where(and(...conditions));

        const records = await db
            .select({
                id: schema.recitationAttendance.id,
                date: schema.recitationAttendance.date,
                status: schema.recitationAttendance.status,
                studentId: schema.recitationStudent.id,
                studentName: schema.recitationStudent.name,
                nis: schema.recitationStudent.nis,
                sessionId: schema.recitationSession.id,
                sessionName: schema.recitationSession.name,
                scheduledTime: schema.recitationSession.scheduledTime,
            })
            .from(schema.recitationAttendance)
            .innerJoin(
                schema.recitationStudent,
                eq(schema.recitationAttendance.studentId, schema.recitationStudent.id),
            )
            .innerJoin(
                schema.recitationSession,
                eq(schema.recitationAttendance.sessionId, schema.recitationSession.id),
            )
            .where(and(...conditions))
            .orderBy(
                asc(schema.recitationAttendance.date),
                asc(schema.recitationSession.scheduledTime),
                asc(schema.recitationStudent.name),
            );

        const totals = { H: 0, S: 0, I: 0, A: 0 };
        for (const record of records) {
            totals[record.status] += 1;
        }

        return { data: records, totals, total: Number(totalResult.total) };
    },
};
