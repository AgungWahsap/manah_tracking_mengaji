/**
 * ✅ Security Fix #3: Centralized Zod validation schemas
 * 
 * Semua input dari client harus melewati validasi sebelum diproses.
 * Import schema yang dibutuhkan di masing-masing route handler.
 */
import { z } from "zod";

// ─── Helper ──────────────────────────────────────────────────────────

/** Zod schema untuk UUID string */
const uuidString = z.string().uuid("ID harus format UUID yang valid");

/** Zod schema untuk date string format YYYY-MM-DD */
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD");

/** Pagination params */
export const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
});

// ─── Attendance ──────────────────────────────────────────────────────

export const checkInSchema = z.object({
    prayerTimeId: uuidString,
    location: z.string().max(255).optional(),
    method: z.enum(["qr_code", "fingerprint", "manual"]).optional(),
    selfieUrl: z.string().url().optional().or(z.literal("")),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
});

export const permitSchema = z.object({
    date: dateString,
    type: z.enum(["sick", "permission", "other"]),
    reason: z.string().max(500).optional(),
    isFullDay: z.boolean().optional(),
    prayerTimeId: uuidString.optional(),
});

export const updatePermitStatusSchema = z.object({
    status: z.enum(["approved", "rejected"]),
});

export const bulkCheckInSchema = z.object({
    prayerTimeId: uuidString,
    userIds: z.array(uuidString).min(1, "Harus ada minimal 1 user"),
    date: dateString,
    status: z.enum(["present", "late", "absent", "excused"]).optional(),
});

export const historyQuerySchema = paginationSchema.extend({
    startDate: dateString.optional(),
    endDate: dateString.optional(),
});

export const globalRecapQuerySchema = paginationSchema.extend({
    date: dateString.optional(),
    startDate: dateString.optional(),
    endDate: dateString.optional(),
    role: z.string().optional(),
    search: z.string().max(100).optional(),
});

export const statsQuerySchema = z.object({
    startDate: dateString.optional(),
    endDate: dateString.optional(),
});

// ─── User ────────────────────────────────────────────────────────────

export const updateProfileSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    phone: z.string().max(20).optional(),
    address: z.string().max(500).optional(),
    waliName: z.string().max(255).optional(),
});

export const createUserSchema = z.object({
    name: z.string().min(1, "Nama wajib diisi").max(255),
    email: z.string().email("Email tidak valid"),
    phone: z.string().max(20).optional(),
    nis: z.string().max(50).optional(),
    address: z.string().max(500).optional(),
    role: z.enum(["admin", "santri", "staff", "guest"]),
    category: z.string().max(100).optional(),
    status: z.enum(["active", "on_leave", "inactive"]).optional(),
    waliName: z.string().max(255).optional(),
    asramaId: uuidString.optional(),
});

export const updateUserSchema = createUserSchema.partial();

export const userListQuerySchema = paginationSchema.extend({
    search: z.string().max(100).optional(),
    role: z.string().optional(),
    status: z.string().optional(),
});

// ─── Access Code ─────────────────────────────────────────────────────

export const createCodeSchema = z.object({
    code: z.string().min(1, "Kode akses wajib diisi").max(20),
    userId: z.string().optional(),
    userData: z.object({
        name: z.string().min(1),
        email: z.string().email(),
        role: z.enum(["admin", "santri", "staff", "guest"]),
        nis: z.string().max(50).optional(),
    }).optional(),
    status: z.enum(["active", "suspended", "temporary"]).optional(),
    expiresAt: z.string().optional(),
});

export const updateCodeSchema = createCodeSchema.partial();

// ─── Export ──────────────────────────────────────────────────────────

export const generateReportSchema = z.object({
    period: z.enum(["daily", "weekly", "monthly"]),
    startDate: dateString,
    endDate: dateString,
    format: z.enum(["pdf", "excel"]),
    categoryFilter: z.string().max(50).optional(),
    includeLog: z.boolean().optional(),
});

// ─── Settings ────────────────────────────────────────────────────────

export const updateSettingsSchema = z.object({
    settings: z.array(z.object({
        key: z.string().min(1).max(100),
        value: z.string(),
    })),
});

export const prayerOffsetsSchema = z.object({
    subuh: z.number().int().min(0).max(120),
    dzuhur: z.number().int().min(0).max(120),
    ashar: z.number().int().min(0).max(120),
    maghrib: z.number().int().min(0).max(120),
    isya: z.number().int().min(0).max(120),
});

// ─── Dashboard ───────────────────────────────────────────────────────

export const updatePrayerTimesSchema = z.object({
    updates: z.record(z.string(), z.object({
        time: z.string().regex(/^\d{2}:\d{2}$/, "Format waktu harus HH:mm"),
        offset: z.number().int().min(0).max(120),
    })),
});

// ─── Sunnah ──────────────────────────────────────────────────────────

export const submitSunnahSchema = z.object({
    practice: z.enum([
        "tahajud", "dhuha", "witir",
        "qobliyah_subuh", "qobliyah_dzuhur", "badiyah_dzuhur",
        "qobliyah_ashar", "qobliyah_maghrib", "badiyah_maghrib",
        "qobliyah_isya", "badiyah_isya"
    ]),
    performed: z.boolean(),
    date: dateString.optional(),
});

// ─── Validation Helper ──────────────────────────────────────────────

import { Request, Response } from "express";

/**
 * Validate request body against a Zod schema.
 * Returns parsed data on success, or sends 400 error and returns null.
 */
export function validateBody<T>(schema: z.ZodType<T>, req: Request, res: Response): T | null {
    const result = schema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({
            success: false,
            error: {
                message: result.error.issues[0]?.message || "Data tidak valid",
                code: "VALIDATION_ERROR",
                details: process.env.NODE_ENV !== "production" ? result.error.issues : undefined,
            },
        });
        return null;
    }
    return result.data;
}

/**
 * Validate request query against a Zod schema.
 * Returns parsed data on success, or sends 400 error and returns null.
 */
export function validateQuery<T>(schema: z.ZodType<T>, req: Request, res: Response): T | null {
    const result = schema.safeParse(req.query);
    if (!result.success) {
        res.status(400).json({
            success: false,
            error: {
                message: result.error.issues[0]?.message || "Parameter tidak valid",
                code: "VALIDATION_ERROR",
                details: process.env.NODE_ENV !== "production" ? result.error.issues : undefined,
            },
        });
        return null;
    }
    return result.data;
}
