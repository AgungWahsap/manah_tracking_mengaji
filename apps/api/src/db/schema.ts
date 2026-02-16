import {
    pgTable,
    uuid,
    text,
    varchar,
    timestamp,
    date,
    time,
    integer,
    boolean,
    real,
    jsonb,
    pgEnum,
} from "drizzle-orm/pg-core";

// ─── Enums ───────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", [
    "admin",
    "santri",
    "staff",
    "guest",
]);

export const userStatusEnum = pgEnum("user_status", [
    "active",
    "on_leave",
    "inactive",
]);

export const codeStatusEnum = pgEnum("code_status", [
    "active",
    "suspended",
    "temporary",
]);

export const attendanceStatusEnum = pgEnum("attendance_status", [
    "present",
    "late",
    "absent",
    "excused",
]);

export const attendanceMethodEnum = pgEnum("attendance_method", [
    "qr_code",
    "fingerprint",
    "manual",
]);

export const permitTypeEnum = pgEnum("permit_type", [
    "sick",
    "permission",
    "other",
]);

export const permitStatusEnum = pgEnum("permit_status", [
    "pending",
    "approved",
    "rejected",
]);

export const exportFormatEnum = pgEnum("export_format", ["pdf", "excel"]);

export const exportPeriodEnum = pgEnum("export_period", [
    "daily",
    "weekly",
    "monthly",
]);

export const sunnahPracticeEnum = pgEnum("sunnah_practice", [
    "tahajud",
    "dhuha",
    "witir",
    "qobliyah_subuh",
    "qobliyah_dzuhur",
    "badiyah_dzuhur",
    "qobliyah_ashar",
    "qobliyah_maghrib",
    "badiyah_maghrib",
    "qobliyah_isya",
    "badiyah_isya"
]);

// ─── Better Auth Tables ──────────────────────────────────────────────

export const user = pgTable("user", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),

    // Extended fields for Manah Tracking
    phone: varchar("phone", { length: 20 }),
    nis: varchar("nis", { length: 50 }), // Nomor Induk Santri
    address: text("address"),
    role: userRoleEnum("role").notNull().default("santri"),
    category: varchar("category", { length: 100 }), // e.g. "Staff Pengajar", "Staff Kebersihan"
    status: userStatusEnum("status").notNull().default("active"),
    waliName: varchar("wali_name", { length: 255 }),
    deviceId: varchar("device_id", { length: 255 }),
    asramaId: uuid("asrama_id").references(() => asrama.id),
    joinedAt: timestamp("joined_at").defaultNow(),
});

export const session = pgTable("session", {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── Application Tables ──────────────────────────────────────────────

export const asrama = pgTable("asrama", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(), // e.g. "Al-Farabi", "Al-Ghazali"
    roomNumber: varchar("room_number", { length: 50 }), // e.g. "101", "Lt. 2"
    createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const accessCode = pgTable("access_code", {
    id: uuid("id").defaultRandom().primaryKey(),
    code: varchar("code", { length: 20 }).notNull().unique(), // e.g. "AB-8392", "M-XXXX"
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    status: codeStatusEnum("status").notNull().default("active"),
    assignedAt: timestamp("assigned_at").defaultNow(),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const prayerTime = pgTable("prayer_time", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 20 }).notNull().unique(), // subuh, dhuhr, asr, maghrib, isya
    scheduledTime: time("scheduled_time").notNull(), // e.g. "04:30"
    offsetMinutes: integer("offset_minutes").notNull().default(15),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const attendanceSourceEnum = pgEnum("attendance_source", ["SELF", "ADMIN"]);

export const attendanceRecord = pgTable("attendance_record", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    prayerTimeId: uuid("prayer_time_id")
        .notNull()
        .references(() => prayerTime.id),
    date: date("date").notNull(),
    checkInTime: time("check_in_time"),
    status: attendanceStatusEnum("status").notNull().default("absent"),
    location: varchar("location", { length: 255 }),
    verifiedBy: varchar("verified_by", { length: 255 }),
    method: attendanceMethodEnum("method"),
    selfieUrl: text("selfie_url"),
    latitude: real("latitude"),
    longitude: real("longitude"),
    source: attendanceSourceEnum("source").notNull().default("SELF"),
    inputBy: text("input_by").references(() => user.id), // UUID of admin who input
    createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const permit = pgTable("permit", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    prayerTimeId: uuid("prayer_time_id").references(() => prayerTime.id), // Nullable: If null, means full day (optional) OR legacy. User wants single time.
    date: date("date").notNull(),
    type: permitTypeEnum("type").notNull(),
    reason: text("reason"),
    isFullDay: boolean("is_full_day").notNull().default(false), // Changed default to false as per user request
    status: permitStatusEnum("status").notNull().default("pending"),
    approvedBy: varchar("approved_by", { length: 255 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const activityLog = pgTable("activity_log", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    action: varchar("action", { length: 100 }).notNull(),
    description: text("description"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const exportHistory = pgTable("export_history", {
    id: uuid("id").defaultRandom().primaryKey(),
    generatedBy: text("generated_by")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    filename: varchar("filename", { length: 500 }).notNull(),
    format: exportFormatEnum("format").notNull(),
    period: exportPeriodEnum("period").notNull(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    categoryFilter: varchar("category_filter", { length: 50 }),
    includeLog: boolean("include_log").notNull().default(false),
    fileUrl: text("file_url"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const systemSettings = pgTable("system_settings", {
    id: uuid("id").defaultRandom().primaryKey(),
    key: varchar("key", { length: 100 }).notNull().unique(),
    value: text("value").notNull(),
    description: text("description"),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    updatedBy: varchar("updated_by", { length: 255 }),
});

export const sunnahRecord = pgTable("sunnah_record", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    practice: sunnahPracticeEnum("practice").notNull(),
    performed: boolean("performed").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});
