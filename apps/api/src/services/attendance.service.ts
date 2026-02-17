import db from "../db/index.js";
import * as schema from "../db/schema.js";
import { eq, and, gte, lte, desc, count, sql, asc } from "drizzle-orm";
interface CheckInData {
    prayerTimeId: string;
    location?: string;
    method?: "qr_code" | "fingerprint" | "manual";
    selfieUrl?: string;
    latitude?: number;
    longitude?: number;
}

interface PermitData {
    date: string;
    type: "sick" | "permission" | "other";
    reason?: string;
    isFullDay?: boolean;
    prayerTimeId?: string;
}

interface HistoryQuery {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
}

interface GlobalRecapQuery {
    page?: number;
    limit?: number;
    date?: string;
    role?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
}

export const attendanceService = {
    /**
     * Record a check-in (HADIR) for a user
     */
    async checkIn(userId: string, data: CheckInData) {
        const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
        const now = new Date().toLocaleTimeString("en-US", { timeZone: "Asia/Jakarta", hour12: false });

        // Check if already checked in for this prayer today
        const existing = await db
            .select()
            .from(schema.attendanceRecord)
            .where(
                and(
                    eq(schema.attendanceRecord.userId, userId),
                    eq(schema.attendanceRecord.prayerTimeId, data.prayerTimeId),
                    eq(schema.attendanceRecord.date, today)
                )
            )
            .limit(1);

        if (existing.length > 0 && existing[0].status !== "absent") {
            throw new Error("Already checked in for this prayer today");
        }

        // Get the prayer time to determine if late
        const [prayer] = await db
            .select()
            .from(schema.prayerTime)
            .where(eq(schema.prayerTime.id, data.prayerTimeId))
            .limit(1);

        if (!prayer) {
            throw new Error("Prayer time not found");
        }

        // Determine status based on offset
        const scheduledTime = prayer.scheduledTime;
        const offsetMinutes = prayer.offsetMinutes;
        const [hours, minutes] = scheduledTime.split(":").map(Number);
        const deadlineMinutes = hours * 60 + minutes + offsetMinutes;
        const [nowH, nowM] = now.split(":").map(Number);
        const currentMinutes = nowH * 60 + nowM;
        const scheduledMinutes = hours * 60 + minutes;

        // STRICT VALIDATION: Cancel if too early
        if (currentMinutes < scheduledMinutes) {
            throw new Error("Waktu sholat belum masuk. Harap tunggu hingga adzan berkumandang.");
        }

        // Reverted: Late check-in is "late", not "absent". Absent is only for no check-in.
        const status = currentMinutes > deadlineMinutes ? "late" : "present";

        if (existing.length > 0) {
            // Update existing absent record
            const [updated] = await db
                .update(schema.attendanceRecord)
                .set({
                    checkInTime: now,
                    status,
                    location: data.location,
                    method: data.method,
                    selfieUrl: data.selfieUrl,
                    latitude: data.latitude,
                    longitude: data.longitude,
                })
                .where(eq(schema.attendanceRecord.id, existing[0].id))
                .returning();

            return updated;
        }

        // Create new attendance record
        const [record] = await db
            .insert(schema.attendanceRecord)
            .values({
                userId,
                prayerTimeId: data.prayerTimeId,
                date: today,
                checkInTime: now,
                status,
                location: data.location,
                method: data.method,
                selfieUrl: data.selfieUrl,
                latitude: data.latitude,
                longitude: data.longitude,
                source: "SELF",
            })
            .returning();

        // Log the activity
        await db.insert(schema.activityLog).values({
            userId,
            action: "attendance_check_in",
            description: `Checked in for ${prayer.name} - ${status === "late" ? "Terlambat" : "Tepat Waktu"}`,
            metadata: { prayerName: prayer.name, status, time: now },
        });

        return record;
    },

    /**
     * Submit a permit/excuse (IJIN)
     */
    async submitPermit(userId: string, data: PermitData) {
        // If specific prayer time, isFullDay is false.
        const isFullDay = data.prayerTimeId ? false : (data.isFullDay ?? false);

        const [permitRecord] = await db
            .insert(schema.permit)
            .values({
                userId,
                date: data.date,
                type: data.type,
                reason: data.reason,
                isFullDay: isFullDay,
                prayerTimeId: data.prayerTimeId,
            })
            .returning();

        // Log the activity
        await db.insert(schema.activityLog).values({
            userId,
            action: "permit_submitted",
            description: `Submitted ${data.type} permit for ${data.date} ${data.prayerTimeId ? '(Single Prayer)' : '(Full Day)'}`,
            metadata: { type: data.type, reason: data.reason, prayerTimeId: data.prayerTimeId },
        });

        return permitRecord;
    },

    /**
     * Bulk Check-In (Admin)
     */
    async bulkCheckIn(adminId: string, data: { prayerTimeId: string; userIds: string[]; date: string; status?: "present" | "late" | "absent" | "excused" }) {
        const { prayerTimeId, userIds, date, status = "present" } = data;
        const now = new Date().toLocaleTimeString("en-US", { timeZone: "Asia/Jakarta", hour12: false });

        const results = [];

        for (const userId of userIds) {
            // Check existing
            const existing = await db
                .select()
                .from(schema.attendanceRecord)
                .where(
                    and(
                        eq(schema.attendanceRecord.userId, userId),
                        eq(schema.attendanceRecord.prayerTimeId, prayerTimeId),
                        eq(schema.attendanceRecord.date, date)
                    )
                )
                .limit(1);

            if (existing.length > 0) {
                // If source is SELF, skip (Admin cannot overwrite User self-check-in)
                if (existing[0].source === "SELF") {
                    results.push({ userId, status: "skipped_self" });
                    continue;
                }

                // If source is ADMIN, update it
                await db
                    .update(schema.attendanceRecord)
                    .set({
                        status,
                        inputBy: adminId,
                    })
                    .where(eq(schema.attendanceRecord.id, existing[0].id));

                results.push({ userId, status: "updated_admin" });
            } else {
                // Insert new record
                await db.insert(schema.attendanceRecord).values({
                    userId,
                    prayerTimeId,
                    date,
                    checkInTime: status === 'present' ? now : null, // Only set time if present? Or maybe null if admin bulk without time?
                    // Ensure checkInTime is set if present, or maybe use "12:00:00" dummy? 
                    // Requirement: "Admin harus bisa menginputkan data absensi kapan saja". 
                    // Let's use current time or 00:00:00 if strictly historical? 
                    // Ideally, we keep it simple: now.
                    status,
                    source: "ADMIN",
                    inputBy: adminId,
                    method: "manual",
                });
                results.push({ userId, status: "inserted" });
            }
        }

        // Log logic
        await db.insert(schema.activityLog).values({
            userId: adminId,
            action: "attendance_bulk_input",
            description: `Bulk input for ${userIds.length} users - ${date}`,
            metadata: { prayerTimeId, count: userIds.length, results },
        });

        return results;
    },


    /**
     * (Admin) Update permit status (Approve/Reject)
     */
    async updatePermitStatus(permitId: string, status: "approved" | "rejected", approvedBy: string) {
        const [updated] = await db
            .update(schema.permit)
            .set({
                status,
                approvedBy,
            })
            .where(eq(schema.permit.id, permitId))
            .returning();

        if (!updated) {
            throw new Error("Permit not found");
        }

        // Log the activity
        await db.insert(schema.activityLog).values({
            userId: approvedBy, // Admin ID as user who performed action
            action: `permit_${status}`,
            description: `${status === 'approved' ? 'Approved' : 'Rejected'} permit ${permitId}`,
            metadata: { permitId, status },
        });

        return updated;
    },

    /**
     * Get a user's attendance history (paginated)
     */
    async getHistory(userId: string, query: HistoryQuery) {
        const page = query.page || 1;
        const limit = query.limit || 10;
        const offset = (page - 1) * limit;

        let whereConditions = [eq(schema.attendanceRecord.userId, userId)];

        if (query.startDate) {
            whereConditions.push(
                gte(schema.attendanceRecord.date, query.startDate)
            );
        }
        if (query.endDate) {
            whereConditions.push(
                lte(schema.attendanceRecord.date, query.endDate)
            );
        }

        const records = await db
            .select({
                id: schema.attendanceRecord.id,
                date: schema.attendanceRecord.date,
                checkInTime: schema.attendanceRecord.checkInTime,
                status: schema.attendanceRecord.status,
                location: schema.attendanceRecord.location,
                verifiedBy: schema.attendanceRecord.verifiedBy,
                method: schema.attendanceRecord.method,
                createdAt: schema.attendanceRecord.createdAt,
                prayerName: schema.prayerTime.name,
                prayerScheduledTime: schema.prayerTime.scheduledTime,
            })
            .from(schema.attendanceRecord)
            .leftJoin(
                schema.prayerTime,
                eq(schema.attendanceRecord.prayerTimeId, schema.prayerTime.id)
            )
            .where(and(...whereConditions))
            .orderBy(desc(schema.attendanceRecord.date), desc(schema.attendanceRecord.createdAt))
            .limit(limit)
            .offset(offset);

        const [totalResult] = await db
            .select({ total: count() })
            .from(schema.attendanceRecord)
            .where(and(...whereConditions));

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
     * Get attendance statistics for a user
     */
    /**
     * Get attendance statistics for a user (Default: Current Month)
     */
    async getStats(userId: string, month?: number, year?: number) {
        // Get Jakarta time components explicitly
        const nowJakarta = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" }); // YYYY-MM-DD
        const [nYear, nMonth, nDay] = nowJakarta.split('-').map(Number);

        const currentMonth = month || nMonth;
        const currentYear = year || nYear;

        // Start of the target month
        const pad = (n: number) => String(n).padStart(2, '0');
        const startStr = `${currentYear}-${pad(currentMonth)}-01`;

        let endStr: string;

        // End date (either end of month or today if current month)
        if (currentYear === nYear && currentMonth === nMonth) {
            endStr = nowJakarta;
        } else {
            // Get last day of month
            const lastDay = new Date(currentYear, currentMonth, 0).getDate();
            endStr = `${currentYear}-${pad(currentMonth)}-${pad(lastDay)}`;
        }

        // Construct Date objects for calculation (UTC assumption is consistent)
        const startDate = new Date(startStr);
        const endDate = new Date(endStr);

        // 1. Get Attendance Records
        const records = await db
            .select({
                status: schema.attendanceRecord.status,
                count: count(),
            })
            .from(schema.attendanceRecord)
            .where(and(
                eq(schema.attendanceRecord.userId, userId),
                gte(schema.attendanceRecord.date, startStr),
                lte(schema.attendanceRecord.date, endStr)
            ))
            .groupBy(schema.attendanceRecord.status);

        const stats = { present: 0, late: 0, absent: 0, excused: 0, total: 0 };

        for (const r of records) {
            const key = r.status as keyof typeof stats;
            if (key in stats && key !== "total") {
                stats[key] = Number(r.count);
            }
        }

        // 2. Get Permits (Approved)
        const permits = await db
            .select()
            .from(schema.permit)
            .where(and(
                eq(schema.permit.userId, userId),
                eq(schema.permit.status, 'approved'),
                gte(schema.permit.date, startStr),
                lte(schema.permit.date, endStr)
            ));

        let permitCount = 0;
        for (const p of permits) {
            if (p.isFullDay) {
                permitCount += 5; // Assume 5 prayers per day
            } else {
                permitCount += 1;
            }
        }
        stats.excused = permitCount;

        // 3. Calculate Absent (Alpha)
        // Total expected prayers = Days passed * 5
        const daysPassed = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const totalExpected = daysPassed * 5;

        // Absent = Expected - (Present + Late + Excused)
        // Note: usage of 'absent' status in attendanceRecord is rare/manual, so we calc 'calculatedAbsent'
        // If 'absent' records exist (e.g. strict mode before revert), they are counted in stats.absent
        // We add calculated missing records.

        const accountedFor = stats.present + stats.late + stats.excused + stats.absent;
        const calculatedAbsent = Math.max(0, totalExpected - accountedFor);

        stats.absent += calculatedAbsent;
        stats.total = stats.present + stats.late + stats.excused + stats.absent;

        return stats;
    },

    /**
     * Get current user's status for today's prayers (Check-ins + Permits)
     */
    async getMyTodayStatus(userId: string) {
        const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });

        // Get Check-ins
        const records = await db
            .select({
                prayerTimeId: schema.attendanceRecord.prayerTimeId,
                status: schema.attendanceRecord.status,
                source: schema.attendanceRecord.source,
            })
            .from(schema.attendanceRecord)
            .where(and(
                eq(schema.attendanceRecord.userId, userId),
                eq(schema.attendanceRecord.date, today)
            ));

        // Get Permits
        const permits = await db
            .select({
                prayerTimeId: schema.permit.prayerTimeId,
                type: schema.permit.type,
                isFullDay: schema.permit.isFullDay
            })
            .from(schema.permit)
            .where(and(
                eq(schema.permit.userId, userId),
                eq(schema.permit.date, today)
            ));

        return { records, permits };
    },

    /**
     * (Admin) Get global daily attendance recap with per-prayer status
     */
    async getGlobalRecap(query: GlobalRecapQuery) {
        const page = query.page || 1;
        const limit = query.limit || 10;
        const offset = (page - 1) * limit;
        const targetDate = query.date || new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });

        // Handle Date Range (Weekly/Monthly)
        const isRange = Boolean(query.startDate && query.endDate && query.startDate !== query.endDate);
        const startDate = (isRange ? query.startDate : targetDate) as string;
        const endDate = (isRange ? query.endDate : targetDate) as string;

        // Build where conditions for users
        const whereConditions = [];
        if (query.search) {
            whereConditions.push(sql`${schema.user.name} ILIKE ${`%${query.search}%`}`);
        }
        if (query.role && query.role !== "Semua Status") {
            whereConditions.push(eq(schema.user.role, query.role as any));
        }

        const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

        // Build user list (Paginated)
        const users = await db
            .select({
                id: schema.user.id,
                name: schema.user.name,
                nis: schema.user.nis,
                role: schema.user.role,
                image: schema.user.image,
                asramaRoom: schema.asrama.roomNumber
            })
            .from(schema.user)
            .leftJoin(schema.asrama, eq(schema.user.asramaId, schema.asrama.id))
            .where(whereClause)
            .orderBy(asc(schema.user.name))
            .limit(limit)
            .offset(offset);

        // Count Total Users for Pagination
        const [totalResult] = await db
            .select({ total: count() })
            .from(schema.user)
            .where(whereClause);

        // Get prayer times
        const prayerTimes = await db
            .select()
            .from(schema.prayerTime)
            .orderBy(asc(schema.prayerTime.scheduledTime));

        // ─── IF RANGE SELECTED (Summary Mode) ─────────────────────────────
        if (isRange) {
            // 1. Get Attendance within range for THESE users
            const attendanceConditions = [
                gte(schema.attendanceRecord.date, startDate),
                lte(schema.attendanceRecord.date, endDate)
            ];

            const attendance = await db
                .select({
                    userId: schema.attendanceRecord.userId,
                    status: schema.attendanceRecord.status,
                    count: count()
                })
                .from(schema.attendanceRecord)
                .where(and(...attendanceConditions))
                .groupBy(schema.attendanceRecord.userId, schema.attendanceRecord.status);

            // 2. Get Permits
            const permitConditions = [
                gte(schema.permit.date, startDate),
                lte(schema.permit.date, endDate),
                eq(schema.permit.status, 'approved')
            ];

            const permits = await db
                .select({
                    userId: schema.permit.userId,
                    count: count()
                })
                .from(schema.permit)
                .where(and(...permitConditions))
                .groupBy(schema.permit.userId);

            // 3. Get Sunnah
            const sunnahConditions = [
                gte(schema.sunnahRecord.date, startDate),
                lte(schema.sunnahRecord.date, endDate),
                eq(schema.sunnahRecord.performed, true)
            ];

            const sunnahRecords = await db
                .select({
                    userId: schema.sunnahRecord.userId,
                    count: count()
                })
                .from(schema.sunnahRecord)
                .where(and(...sunnahConditions))
                .groupBy(schema.sunnahRecord.userId);

            // Calculate Aggregates
            // Calculate Total Prayers in Period for Alpha
            const start = new Date(startDate);
            const end = new Date(endDate);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            const totalPrayersPeriod = diffDays * 5;

            const summaryData = users.map(user => {
                let present = 0;
                let late = 0;
                let excused = 0;
                let sunnah = 0;

                // Attendance
                const userAtt = attendance.filter(a => a.userId === user.id);
                userAtt.forEach(a => {
                    if (a.status === 'present') present += Number(a.count);
                    if (a.status === 'late') late += Number(a.count); // Late acts as Alpha in new logic? 
                    // User said "Hapus bagian telatnya karena sekarang telat/ tidak absen di anggap alfa" for EXPORT.
                    // But for RECAP VIEW, maybe they still want to know who is late?
                    // "bisa melihat selama seminggu dan sebulan"
                    // Assuming consistent with Export: Show Present, Alpha, Excused.
                    // But I will return all raw stats so frontend can decide.
                });

                // Permits
                const userPermit = permits.find(p => p.userId === user.id);
                if (userPermit) excused = Number(userPermit.count);

                // Sunnah
                const userSunnah = sunnahRecords.find(s => s.userId === user.id);
                if (userSunnah) sunnah = Number(userSunnah.count);

                // Alpha Logic: Total Expected - (Present + Excused)
                // If Late is considered Alpha, then Present is strictly "Present".
                const alpha = Math.max(0, totalPrayersPeriod - (present + excused));

                return {
                    user,
                    stats: {
                        present,
                        late, // Included but might not be shown as separate valid "Presence" if alpha logic applies
                        excused,
                        alpha,
                        sunnah
                    }
                };
            });

            return {
                mode: 'summary',
                startDate,
                endDate,
                data: summaryData,
                pagination: {
                    page,
                    limit,
                    total: Number(totalResult.total),
                    totalPages: Math.ceil(Number(totalResult.total) / limit),
                },
                stats: {} // Global stats for period? (Optional)
            };
        }

        // ─── EXISTING DAILY LOGIC ─────────────────────────────────────────

        // Get attendance records for target date
        const attendanceRecords = await db
            .select()
            .from(schema.attendanceRecord)
            .where(eq(schema.attendanceRecord.date, targetDate));

        // Get permits for target date
        const permits = await db
            .select()
            .from(schema.permit)
            .where(
                and(
                    eq(schema.permit.date, targetDate)
                    // We now include pending permits so admin can see them
                    // eq(schema.permit.status, "approved") 
                )
            );

        // Map attendance per user per prayer
        const recap = users.map((u) => {
            const userAttendance: Record<string, any> = {};

            for (const prayer of prayerTimes) {
                const record = attendanceRecords.find(
                    (r) => r.userId === u.id && r.prayerTimeId === prayer.id
                );

                // Find permit for this specific prayer or full day
                const prayerPermit = permits.find(p =>
                    p.userId === u.id &&
                    (p.isFullDay || p.prayerTimeId === prayer.id)
                );

                if (prayerPermit) {
                    userAttendance[prayer.name] = {
                        status: "excused",
                        permit: prayerPermit
                    };
                } else {
                    userAttendance[prayer.name] = record
                        ? {
                            status: record.status,
                            checkInTime: record.checkInTime,
                        }
                        : { status: "pending" };
                }
            }

            // Global permit (full day) for compatibility/reference
            const globalPermit = permits.find((p) => p.userId === u.id && p.isFullDay);

            return {
                user: u,
                attendance: userAttendance,
                permit: globalPermit || null, // Only return if full day, otherwise handled per prayer
            };
        });

        // Get statistics for the day
        const statsQuery = await db
            .select({
                status: schema.attendanceRecord.status,
                count: count(),
            })
            .from(schema.attendanceRecord)
            .where(eq(schema.attendanceRecord.date, targetDate))
            .groupBy(schema.attendanceRecord.status);

        const dailyStats = {
            present: 0,
            late: 0,
            excused: 0,
            absent: 0, // This is hard to calc accurately without verifying every user x prayer
            totalCheckIns: 0,
        };

        for (const s of statsQuery) {
            const key = s.status as keyof typeof dailyStats;
            if (key in dailyStats) {
                dailyStats[key] = Number(s.count);
            }
            dailyStats.totalCheckIns += Number(s.count);
        }

        // Count permits
        const [permitCount] = await db
            .select({ count: count() })
            .from(schema.permit)
            .where(
                and(
                    eq(schema.permit.date, targetDate),
                    eq(schema.permit.status, "approved")
                )
            );
        dailyStats.excused += Number(permitCount.count);

        // Get total active users for percentage calculation
        const [totalActiveUsers] = await db
            .select({ count: count() })
            .from(schema.user)
            .where(eq(schema.user.status, "active"));

        const totalUsersCount = Number(totalActiveUsers?.count || 0);

        return {
            mode: 'daily',
            date: targetDate,
            prayerTimes: prayerTimes.map((p) => ({
                id: p.id,
                name: p.name,
                scheduledTime: p.scheduledTime,
            })),
            stats: {
                ...dailyStats,
                totalUsers: totalUsersCount
            },
            data: recap,
            pagination: {
                page,
                limit,
                total: Number(totalResult.total),
                totalPages: Math.ceil(Number(totalResult.total) / limit),
            },
        };
    },

    /**
     * Get attendance report for export
     */
    async getReport(query: { startDate: string; endDate: string; role?: string }) {
        const { startDate, endDate, role } = query;

        // 1. Get Users
        const whereConditions = [eq(schema.user.status, 'active')];
        if (role && role !== 'all') {
            whereConditions.push(eq(schema.user.role, role as any));
        }

        const users = await db
            .select()
            .from(schema.user)
            .where(and(...whereConditions))
            .orderBy(asc(schema.user.name));

        // 2. Get Attendance within range
        const attendanceConditions = [
            gte(schema.attendanceRecord.date, startDate),
            lte(schema.attendanceRecord.date, endDate)
        ];

        const attendance = await db
            .select({
                userId: schema.attendanceRecord.userId,
                status: schema.attendanceRecord.status,
                count: count()
            })
            .from(schema.attendanceRecord)
            .where(and(...attendanceConditions))
            .groupBy(schema.attendanceRecord.userId, schema.attendanceRecord.status);

        // 3. Get Permits
        const permitConditions = [
            gte(schema.permit.date, startDate),
            lte(schema.permit.date, endDate),
            eq(schema.permit.status, 'approved')
        ];

        const permits = await db
            .select({
                userId: schema.permit.userId,
                count: count()
            })
            .from(schema.permit)
            .where(and(...permitConditions))
            .groupBy(schema.permit.userId);

        // 4. Get Sunnah Records
        const sunnahConditions = [
            gte(schema.sunnahRecord.date, startDate),
            lte(schema.sunnahRecord.date, endDate),
            eq(schema.sunnahRecord.performed, true)
        ];

        const sunnahRecords = await db
            .select({
                userId: schema.sunnahRecord.userId,
                practice: schema.sunnahRecord.practice,
                count: count()
            })
            .from(schema.sunnahRecord)
            .where(and(...sunnahConditions))
            .groupBy(schema.sunnahRecord.userId, schema.sunnahRecord.practice);

        // 5. Aggregate
        const report = users.map(user => {
            const userStats = {
                present: 0,
                late: 0,
                excused: 0,
                totalCheckIns: 0,
                sunnah: {
                    total: 0,
                    details: {} as Record<string, number>
                }
            };

            // Fill attendance stats
            const userAtt = attendance.filter(a => a.userId === user.id);
            userAtt.forEach(a => {
                const c = Number(a.count);
                if (a.status === 'present') userStats.present += c;
                if (a.status === 'late') userStats.late += c;
                userStats.totalCheckIns += c;
            });

            // Fill permit stats
            const userPermit = permits.find(p => p.userId === user.id);
            if (userPermit) {
                userStats.excused = Number(userPermit.count);
            }

            // Fill Sunnah stats
            const userSunnah = sunnahRecords.filter(s => s.userId === user.id);
            userSunnah.forEach(s => {
                const c = Number(s.count);
                userStats.sunnah.total += c;
                if (s.practice) {
                    userStats.sunnah.details[s.practice] = c;
                }
            });

            // Calculate Alfa (Absent)
            // Total expected = (Days in range) * 5 prayers
            const start = new Date(startDate);
            const end = new Date(endDate);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            const totalPrayers = diffDays * 5;

            // Alfa = Total Expected - (Present + Late + Excused)
            // Note: User said "Telat/tidak absen dianggap alfa". 
            // So if they are Present (Tepat Waktu), they are Present.
            // If they are Late, do we count it as Present or Alfa?
            // "Hapus bagian telatnya karena sekarang telat/ tidak absen di anggap alfa"
            // This implies Late -> Alfa.
            // So Present only counts "present" status.
            // Alfa = Total Expected - (Present + Excused)

            // Wait, previous logic summed Present + Late into totalCheckIns.
            // If Late is Alfa, then Total Check-In (Hadir) should ONLY be Present.

            const alpha = totalPrayers - (userStats.present + userStats.excused);

            return {
                user: {
                    name: user.name,
                    nis: user.nis,
                    role: user.role
                },
                stats: {
                    ...userStats,
                    alpha: Math.max(0, alpha) // Ensure no negative alpha
                }
            };
        });

        return { data: report };
    },

    /**
     * Reset daily attendance (Delete all records for a date)
     */
    async resetDailyAttendance(date: string) {
        // Delete attendance records
        await db
            .delete(schema.attendanceRecord)
            .where(eq(schema.attendanceRecord.date, date));

        // Delete sunnah records
        await db
            .delete(schema.sunnahRecord)
            .where(eq(schema.sunnahRecord.date, date));

        // Delete permits
        await db
            .delete(schema.permit)
            .where(eq(schema.permit.date, date));

        return { success: true };
    },
};
