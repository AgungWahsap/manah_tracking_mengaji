import db from "../db/index.js";
import * as schema from "../db/schema.js";
import { eq, desc, count, and, gte, lte } from "drizzle-orm";
import ExcelJS from "exceljs";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Resolve exports directory relative to project root
// Resolve exports directory relative to project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if running in Vercel/Production
const isVercel = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
const EXPORTS_DIR = isVercel
    ? path.join('/tmp', 'exports')
    : path.resolve(__dirname, "../../exports");

// Ensure exports directory exists
if (!fs.existsSync(EXPORTS_DIR)) {
    fs.mkdirSync(EXPORTS_DIR, { recursive: true });
}

interface GenerateReportParams {
    generatedBy: string;
    period: "daily" | "weekly" | "monthly";
    startDate: string;
    endDate: string;
    format: "pdf" | "excel";
    categoryFilter?: string;
    includeLog?: boolean;
}

interface HistoryQuery {
    page?: number;
    limit?: number;
}

export const exportService = {
    /**
     * (Admin) Generate and record an export report
     */
    async generateReport(params: GenerateReportParams) {
        // Build filename
        const periodLabel =
            params.period === "daily"
                ? "Harian"
                : params.period === "weekly"
                    ? "Mingguan"
                    : "Bulanan";
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const ext = params.format === "pdf" ? "pdf" : "xlsx";
        const filename = `Laporan_${periodLabel}_${timestamp}.${ext}`;
        const filePath = path.join(EXPORTS_DIR, filename);

        // Query attendance records for the date range
        let whereConditions: any[] = [
            gte(schema.attendanceRecord.date, params.startDate),
            lte(schema.attendanceRecord.date, params.endDate),
        ];

        const records = await db
            .select({
                userName: schema.user.name,
                userNis: schema.user.nis,
                userRole: schema.user.role,
                userCategory: schema.user.category,
                date: schema.attendanceRecord.date,
                status: schema.attendanceRecord.status,
                checkInTime: schema.attendanceRecord.checkInTime,
                prayerName: schema.prayerTime.name,
                location: schema.attendanceRecord.location,
                method: schema.attendanceRecord.method,
            })
            .from(schema.attendanceRecord)
            .innerJoin(schema.user, eq(schema.attendanceRecord.userId, schema.user.id))
            .innerJoin(schema.prayerTime, eq(schema.attendanceRecord.prayerTimeId, schema.prayerTime.id))
            .where(and(...whereConditions))
            .orderBy(desc(schema.attendanceRecord.date));

        // Generate the Excel file
        const workbook = new ExcelJS.Workbook();
        workbook.creator = "Manah Tracking";
        workbook.created = new Date();

        const sheet = workbook.addWorksheet("Laporan Absensi");

        // Header row styling
        sheet.columns = [
            { header: "Nama", key: "userName", width: 25 },
            { header: "NIS", key: "userNis", width: 15 },
            { header: "Role", key: "userRole", width: 12 },
            { header: "Kategori", key: "userCategory", width: 18 },
            { header: "Tanggal", key: "date", width: 14 },
            { header: "Sholat", key: "prayerName", width: 12 },
            { header: "Status", key: "status", width: 12 },
            { header: "Jam Hadir", key: "checkInTime", width: 12 },
            { header: "Lokasi", key: "location", width: 20 },
            { header: "Metode", key: "method", width: 12 },
        ];

        // Style the header row
        const headerRow = sheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
        headerRow.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF1E3A5F" },
        };
        headerRow.alignment = { horizontal: "center", vertical: "middle" };
        headerRow.height = 24;

        // Add data rows
        for (const record of records) {
            sheet.addRow({
                userName: record.userName,
                userNis: record.userNis || "-",
                userRole: record.userRole,
                userCategory: record.userCategory || "-",
                date: record.date,
                prayerName: record.prayerName,
                status: record.status,
                checkInTime: record.checkInTime || "-",
                location: record.location || "-",
                method: record.method || "-",
            });
        }

        // Add alternating row colors for readability
        for (let i = 2; i <= sheet.rowCount; i++) {
            const row = sheet.getRow(i);
            if (i % 2 === 0) {
                row.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFF0F4F8" },
                };
            }
            row.alignment = { vertical: "middle" };
        }

        // Add summary sheet if includeLog is true
        if (params.includeLog) {
            const summarySheet = workbook.addWorksheet("Ringkasan");
            summarySheet.columns = [
                { header: "Keterangan", key: "label", width: 25 },
                { header: "Jumlah", key: "value", width: 15 },
            ];

            const totalRecords = records.length;
            const present = records.filter(r => r.status === "present").length;
            const late = records.filter(r => r.status === "late").length;
            const absent = records.filter(r => r.status === "absent").length;
            const excused = records.filter(r => r.status === "excused").length;

            summarySheet.addRows([
                { label: "Total Record", value: totalRecords },
                { label: "Hadir", value: present },
                { label: "Terlambat", value: late },
                { label: "Tidak Hadir", value: absent },
                { label: "Izin", value: excused },
                { label: "Periode", value: `${params.startDate} s/d ${params.endDate}` },
            ]);

            const summaryHeader = summarySheet.getRow(1);
            summaryHeader.font = { bold: true, color: { argb: "FFFFFFFF" } };
            summaryHeader.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FF1E3A5F" },
            };
        }

        // Write the file
        await workbook.xlsx.writeFile(filePath);

        const fileUrl = `/exports/${filename}`;

        // Save to export_history table
        const [exportRecord] = await db
            .insert(schema.exportHistory)
            .values({
                generatedBy: params.generatedBy,
                filename,
                format: params.format,
                period: params.period,
                startDate: params.startDate,
                endDate: params.endDate,
                categoryFilter: params.categoryFilter || "all",
                includeLog: params.includeLog || false,
                fileUrl,
            })
            .returning();

        return exportRecord;
    },

    /**
     * (Admin) Get export history list
     */
    async getHistory(query: HistoryQuery) {
        const page = query.page || 1;
        const limit = query.limit || 10;
        const offset = (page - 1) * limit;

        const records = await db
            .select({
                id: schema.exportHistory.id,
                filename: schema.exportHistory.filename,
                format: schema.exportHistory.format,
                period: schema.exportHistory.period,
                startDate: schema.exportHistory.startDate,
                endDate: schema.exportHistory.endDate,
                fileUrl: schema.exportHistory.fileUrl,
                createdAt: schema.exportHistory.createdAt,
                generatedByName: schema.user.name,
            })
            .from(schema.exportHistory)
            .leftJoin(
                schema.user,
                eq(schema.exportHistory.generatedBy, schema.user.id)
            )
            .orderBy(desc(schema.exportHistory.createdAt))
            .limit(limit)
            .offset(offset);

        const [totalResult] = await db
            .select({ total: count() })
            .from(schema.exportHistory);

        return {
            data: records,
            pagination: {
                page,
                limit,
                total: Number(totalResult.total),
                totalPages: Math.ceil(Number(totalResult.total) / limit),
            },
        };
    },

    /**
     * (Admin) Get a specific export record by ID
     */
    async getById(id: string) {
        const [record] = await db
            .select()
            .from(schema.exportHistory)
            .where(eq(schema.exportHistory.id, id))
            .limit(1);

        if (!record) {
            throw new Error("Export record not found");
        }

        return record;
    },

    /**
     * Get the absolute file path for an export
     */
    getFilePath(filename: string): string {
        return path.join(EXPORTS_DIR, filename);
    },
};
