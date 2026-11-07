import { and, asc, count, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import ExcelJS from "exceljs";
import db from "../db/index.js";
import * as schema from "../db/schema.js";

const SESSION_NAMES = ["subuh", "dzuhur", "ashar", "isya"] as const;
type SessionName = (typeof SESSION_NAMES)[number];
type AttendanceCode = "H" | "S" | "I" | "A";
const ATTENDANCE_STATUS_LABELS: Record<AttendanceCode, string> = {
    H: "hadir",
    S: "sakit",
    I: "izin",
    A: "alfa",
};

export const recitationService = {
    async listClasses(includeInactive = false) {
        const conditions = includeInactive ? undefined : eq(schema.recitationClass.isActive, true);
        const classes = await db
            .select({
                id: schema.recitationClass.id,
                name: schema.recitationClass.name,
                isActive: schema.recitationClass.isActive,
                studentCount: count(schema.recitationStudent.id),
            })
            .from(schema.recitationClass)
            .leftJoin(schema.recitationStudent, eq(schema.recitationStudent.classId, schema.recitationClass.id))
            .where(conditions)
            .groupBy(schema.recitationClass.id)
            .orderBy(asc(schema.recitationClass.name));
        return classes.map((item) => ({ ...item, studentCount: Number(item.studentCount) }));
    },

    async createClass(name: string) {
        const [created] = await db
            .insert(schema.recitationClass)
            .values({ name })
            .returning();
        return created;
    },

    async updateClass(id: string, data: { name?: string; isActive?: boolean }) {
        const [updated] = await db
            .update(schema.recitationClass)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(schema.recitationClass.id, id))
            .returning();
        if (!updated) throw new Error("Kelas tidak ditemukan");
        return updated;
    },

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

    async listStudents(search?: string, includeInactive = false, classId?: string) {
        const conditions = [];
        if (!includeInactive) {
            conditions.push(eq(schema.recitationStudent.isActive, true));
        }
        if (classId) {
            conditions.push(eq(schema.recitationStudent.classId, classId));
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

    async createStudent(data: { name: string; nis?: string | null; classId: string }) {
        const [recitationClass] = await db
            .select({ id: schema.recitationClass.id, isActive: schema.recitationClass.isActive })
            .from(schema.recitationClass)
            .where(eq(schema.recitationClass.id, data.classId))
            .limit(1);
        if (!recitationClass || !recitationClass.isActive) {
            throw new Error("Kelas tidak ditemukan atau tidak aktif");
        }
        const [student] = await db
            .insert(schema.recitationStudent)
            .values({ name: data.name, nis: data.nis || null, classId: data.classId })
            .returning();
        return student;
    },

    async updateStudent(id: string, data: { name?: string; nis?: string | null; classId?: string; isActive?: boolean }) {
        if (data.classId) {
            const [recitationClass] = await db
                .select({ id: schema.recitationClass.id, isActive: schema.recitationClass.isActive })
                .from(schema.recitationClass)
                .where(eq(schema.recitationClass.id, data.classId))
                .limit(1);
            if (!recitationClass || !recitationClass.isActive) {
                throw new Error("Kelas tidak ditemukan atau tidak aktif");
            }
        }
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

    async getSessionAttendance(date: string, sessionId: string, classId: string) {
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
            .where(and(
                eq(schema.recitationStudent.isActive, true),
                eq(schema.recitationStudent.classId, classId),
            ))
            .orderBy(asc(schema.recitationStudent.name));

        return students;
    },

    async saveSessionAttendance(
        adminId: string,
        data: { date: string; sessionId: string; classId: string; attendance: { studentId: string; status: AttendanceCode }[] },
    ) {
        const [recitationClass] = await db
            .select({ id: schema.recitationClass.id, isActive: schema.recitationClass.isActive })
            .from(schema.recitationClass)
            .where(eq(schema.recitationClass.id, data.classId))
            .limit(1);
        if (!recitationClass || !recitationClass.isActive) {
            throw new Error("Kelas tidak ditemukan atau tidak aktif");
        }
        const activeStudents = await db
            .select({ id: schema.recitationStudent.id })
            .from(schema.recitationStudent)
            .where(and(
                eq(schema.recitationStudent.isActive, true),
                eq(schema.recitationStudent.classId, data.classId),
            ));
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

        return { savedCount: rows.length, date: data.date, sessionId: data.sessionId, classId: data.classId };
    },

    async getRecap(startDate: string, endDate: string, sessionId?: string, classId?: string) {
        const conditions = [
            gte(schema.recitationAttendance.date, startDate),
            lte(schema.recitationAttendance.date, endDate),
        ];
        if (sessionId) {
            conditions.push(eq(schema.recitationAttendance.sessionId, sessionId));
        }
        if (classId) {
            conditions.push(eq(schema.recitationStudent.classId, classId));
        }

        const [totalResult] = await db
            .select({ total: count() })
            .from(schema.recitationAttendance)
            .innerJoin(
                schema.recitationStudent,
                eq(schema.recitationAttendance.studentId, schema.recitationStudent.id),
            )
            .where(and(...conditions));

        const records = await db
            .select({
                id: schema.recitationAttendance.id,
                date: schema.recitationAttendance.date,
                status: schema.recitationAttendance.status,
                studentId: schema.recitationStudent.id,
                studentName: schema.recitationStudent.name,
                nis: schema.recitationStudent.nis,
                className: schema.recitationClass.name,
                sessionId: schema.recitationSession.id,
                sessionName: schema.recitationSession.name,
                scheduledTime: schema.recitationSession.scheduledTime,
            })
            .from(schema.recitationAttendance)
            .innerJoin(
                schema.recitationStudent,
                eq(schema.recitationAttendance.studentId, schema.recitationStudent.id),
            )
            .leftJoin(
                schema.recitationClass,
                eq(schema.recitationStudent.classId, schema.recitationClass.id),
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

    async exportRecapWorkbook(startDate: string, endDate: string, sessionId?: string, classId?: string) {
        const recap = await this.getRecap(startDate, endDate, sessionId, classId);
        const studentRows = new Map<string, {
            studentName: string;
            nis: string | null;
            className: string | null;
            sessions: Record<SessionName, Record<AttendanceCode, number>>;
        }>();
        const emptyCounts = (): Record<AttendanceCode, number> => ({ H: 0, S: 0, I: 0, A: 0 });

        for (const record of recap.data) {
            let student = studentRows.get(record.studentId);
            if (!student) {
                student = {
                    studentName: record.studentName,
                    nis: record.nis,
                    className: record.className,
                    sessions: {
                        subuh: emptyCounts(),
                        dzuhur: emptyCounts(),
                        ashar: emptyCounts(),
                        isya: emptyCounts(),
                    },
                };
                studentRows.set(record.studentId, student);
            }
            student.sessions[record.sessionName as SessionName][record.status] += 1;
        }

        const workbook = new ExcelJS.Workbook();
        workbook.creator = "Manah Tracking";
        const sheet = workbook.addWorksheet("Rekap Absensi");
        sheet.columns = [
            { key: "label", width: 22 },
            { key: "value", width: 18 },
            { key: "className", width: 24 },
            { key: "subuh", width: 48 },
            { key: "dzuhur", width: 48 },
            { key: "ashar", width: 48 },
            { key: "isya", width: 48 },
        ];

        sheet.mergeCells("A1:G1");
        sheet.getCell("A1").value = "Rekap Absensi Mengaji";
        sheet.getCell("A1").font = { bold: true, size: 16 };
        sheet.addRow(["Periode", `${startDate} s.d. ${endDate}`]);
        sheet.addRow(["Filter waktu", sessionId ? recap.data.find((record) => record.sessionId === sessionId)?.sessionName ?? "Waktu terpilih" : "Semua waktu"]);
        sheet.addRow(["Total kelas", classId ? recap.data.find((record) => record.className)?.className ?? "Kelas terpilih" : "Semua kelas"]);
        sheet.addRow([]);

        const totalHeader = sheet.addRow(["Total keseluruhan", "Jumlah"]);
        totalHeader.font = { bold: true };
        for (const status of ["H", "S", "I", "A"] as const) {
            sheet.addRow([`Total ${ATTENDANCE_STATUS_LABELS[status]}`, recap.totals[status]]);
        }

        sheet.addRow([]);
        const detailTitle = sheet.addRow(["Rincian per santri"]);
        detailTitle.font = { bold: true, size: 12 };
        const detailHeader = sheet.addRow(["Nama Santri", "NIS", "Kelas", "Subuh", "Dzuhur", "Ashar", "Isya"]);
        detailHeader.font = { bold: true, color: { argb: "FFFFFFFF" } };
        detailHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F4E78" } };

        const statusSummary = (counts: Record<AttendanceCode, number>) =>
            (["H", "S", "I", "A"] as const)
                .map((status) => `${counts[status]}x ${ATTENDANCE_STATUS_LABELS[status]}`)
                .join(", ");

        for (const student of [...studentRows.values()].sort((a, b) => a.studentName.localeCompare(b.studentName, "id"))) {
            sheet.addRow([
                student.studentName,
                student.nis || "",
                student.className || "",
                statusSummary(student.sessions.subuh),
                statusSummary(student.sessions.dzuhur),
                statusSummary(student.sessions.ashar),
                statusSummary(student.sessions.isya),
            ]);
        }

        sheet.views = [{ state: "frozen", ySplit: detailHeader.number }];
        sheet.autoFilter = {
            from: { row: detailHeader.number, column: 1 },
            to: { row: detailHeader.number + studentRows.size, column: 7 },
        };
        sheet.getColumn(2).alignment = { horizontal: "left" };

        return {
            fileName: `rekap-mengaji-${startDate}-${endDate}.xlsx`,
            buffer: Buffer.from(await workbook.xlsx.writeBuffer()),
        };
    },

    async exportClassWorkbook(classId: string) {
        const [selectedClass] = await db
            .select()
            .from(schema.recitationClass)
            .where(eq(schema.recitationClass.id, classId))
            .limit(1);
        if (!selectedClass) throw new Error("Kelas tidak ditemukan");

        const students = await db
            .select({ name: schema.recitationStudent.name, nis: schema.recitationStudent.nis })
            .from(schema.recitationStudent)
            .where(and(
                eq(schema.recitationStudent.classId, classId),
                eq(schema.recitationStudent.isActive, true),
            ))
            .orderBy(asc(schema.recitationStudent.name));

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("Daftar Santri");
        sheet.columns = [
            { header: "Nama Santri", key: "name", width: 35 },
            { header: "NIS", key: "nis", width: 20 },
        ];
        sheet.getRow(1).font = { bold: true };
        sheet.addRows(students.map((student) => ({ name: student.name, nis: student.nis || "" })));
        sheet.views = [{ state: "frozen", ySplit: 1 }];
        sheet.autoFilter = "A1:B1";
        const instructions = workbook.addWorksheet("Petunjuk");
        instructions.addRows([
            ["Petunjuk impor daftar santri"],
            ["Isi kolom Nama Santri. NIS bersifat opsional."],
            ["Jangan ubah nama kolom pada baris pertama."],
            ["Baris kosong akan diabaikan. Baris yang tidak ada di file tidak menghapus data."],
        ]);
        instructions.getRow(1).font = { bold: true };
        instructions.getColumn(1).width = 90;

        return {
            fileName: `daftar-santri-${selectedClass.name.replace(/[^\p{L}\p{N}-]+/gu, "-")}.xlsx`,
            buffer: Buffer.from(await workbook.xlsx.writeBuffer()),
        };
    },

    async importClassWorkbook(classId: string, fileBase64: string) {
        const [selectedClass] = await db
            .select({ id: schema.recitationClass.id, isActive: schema.recitationClass.isActive })
            .from(schema.recitationClass)
            .where(eq(schema.recitationClass.id, classId))
            .limit(1);
        if (!selectedClass || !selectedClass.isActive) {
            throw new Error("Kelas tidak ditemukan atau tidak aktif");
        }

        const workbook = new ExcelJS.Workbook();
        const decoded = Buffer.from(fileBase64, "base64");
        const workbookBuffer = new ArrayBuffer(decoded.length);
        new Uint8Array(workbookBuffer).set(decoded);
        try {
            await workbook.xlsx.load(workbookBuffer);
        } catch {
            throw new Error("File Excel tidak valid atau rusak");
        }
        const sheet = workbook.worksheets[0];
        if (!sheet || sheet.rowCount < 1) {
            throw new Error("File Excel kosong");
        }
        if (sheet.rowCount > 2001) {
            throw new Error("Maksimal 2.000 baris santri per impor");
        }

        const headers = new Map<string, number>();
        sheet.getRow(1).eachCell((cell, column) => {
            headers.set(String(cell.text).trim().toLowerCase(), column);
        });
        const nameColumn = headers.get("nama santri") ?? headers.get("nama");
        const nisColumn = headers.get("nis");
        if (!nameColumn) {
            throw new Error("Header Excel harus memiliki kolom Nama Santri");
        }

        const rows: { rowNumber: number; name: string; nis: string | null }[] = [];
        sheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return;
            const name = String(row.getCell(nameColumn).text || "").trim();
            const nis = nisColumn ? String(row.getCell(nisColumn).text || "").trim() || null : null;
            if (!name && !nis) return;
            if (!name) throw new Error(`Nama Santri wajib diisi pada baris ${rowNumber}`);
            if (name.length > 255 || (nis && nis.length > 50)) {
                throw new Error(`Nama atau NIS terlalu panjang pada baris ${rowNumber}`);
            }
            rows.push({ rowNumber, name, nis });
        });

        if (rows.length === 0) throw new Error("Tidak ada nama santri untuk diimpor");
        if (rows.length > 2000) throw new Error("Maksimal 2.000 baris santri per impor");

        const seenNis = new Set<string>();
        const seenNames = new Set<string>();
        for (const row of rows) {
            const key = row.nis ? `nis:${row.nis}` : `name:${row.name.toLocaleLowerCase("id-ID")}`;
            if (seenNis.has(key) || seenNames.has(key)) {
                throw new Error(`Data ganda pada file Excel di baris ${row.rowNumber}`);
            }
            seenNis.add(key);
            seenNames.add(key);
        }

        let added = 0;
        let updated = 0;
        let moved = 0;
        await db.transaction(async (tx) => {
            for (const row of rows) {
                const [existing] = row.nis
                    ? await tx.select().from(schema.recitationStudent).where(eq(schema.recitationStudent.nis, row.nis)).limit(1)
                    : await tx.select().from(schema.recitationStudent).where(and(
                        eq(schema.recitationStudent.classId, classId),
                        sql`lower(${schema.recitationStudent.name}) = lower(${row.name})`,
                    )).limit(1);

                if (existing) {
                    if (existing.classId && existing.classId !== classId) moved += 1;
                    await tx.update(schema.recitationStudent)
                        .set({ name: row.name, nis: row.nis || existing.nis, classId, isActive: true, updatedAt: new Date() })
                        .where(eq(schema.recitationStudent.id, existing.id));
                    updated += 1;
                } else {
                    await tx.insert(schema.recitationStudent)
                        .values({ name: row.name, nis: row.nis, classId });
                    added += 1;
                }
            }
        });

        return { added, updated, moved, total: rows.length };
    },
};
