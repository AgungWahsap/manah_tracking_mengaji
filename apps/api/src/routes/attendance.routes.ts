import { Router, Request, Response } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware.js";
import { attendanceService } from "../services/attendance.service.js";
import { sanitizeErrorMessage } from "../middleware/error-sanitizer.js";
import { validateBody, validateQuery, checkInSchema, permitSchema, updatePermitStatusSchema, bulkCheckInSchema, historyQuerySchema, globalRecapQuerySchema, statsQuerySchema } from "../middleware/validators.js";

const router = Router();

/**
 * POST /api/attendance/check-in
 * Submit attendance (HADIR)
 */
router.post("/check-in", requireAuth, async (req: Request, res: Response) => {
    try {
        const data = validateBody(checkInSchema, req, res);
        if (!data) return;
        const record = await attendanceService.checkIn(req.user!.id, data);
        res.status(201).json({ success: true, data: record });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            error: { message: sanitizeErrorMessage(error, "Gagal memproses data"), code: "CHECK_IN_FAILED" },
        });
    }
});

/**
 * POST /api/attendance/permit
 * Submit a permit/excuse (IJIN)
 */
router.post("/permit", requireAuth, async (req: Request, res: Response) => {
    try {
        const data = validateBody(permitSchema, req, res);
        if (!data) return;
        const permit = await attendanceService.submitPermit(req.user!.id, data);
        res.status(201).json({ success: true, data: permit });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            error: { message: sanitizeErrorMessage(error, "Gagal memproses data"), code: "PERMIT_FAILED" },
        });
    }
});

/**
 * PUT /api/attendance/permit/:id
 * (Admin) Approve/Reject permit
 */
router.put("/permit/:id", requireAuth, requireAdmin, async (req: Request<{ id: string }>, res: Response) => {
    try {
        const data = validateBody(updatePermitStatusSchema, req, res);
        if (!data) return;

        const permit = await attendanceService.updatePermitStatus(req.params.id, data.status, req.user!.id);
        res.json({ success: true, data: permit });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            error: { message: sanitizeErrorMessage(error, "Gagal memproses data"), code: "UPDATE_FAILED" },
        });
    }
});

/**
 * GET /api/attendance/permits
 * (Admin) List all permits with optional status filter
 */
router.get("/permits", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
        const query = {
            status: req.query.status as string || 'pending',
            page: parseInt(req.query.page as string) || 1,
            limit: parseInt(req.query.limit as string) || 20,
        };
        const result = await attendanceService.getPendingPermits(query);
        res.json({ success: true, ...result });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: { message: sanitizeErrorMessage(error, "Gagal memproses data"), code: "INTERNAL_ERROR" },
        });
    }
});

/**
 * GET /api/attendance/history
 * User's attendance history (paginated)
 */
router.get("/history", requireAuth, async (req: Request, res: Response) => {
    try {
        const query = {
            page: parseInt(req.query.page as string) || 1,
            limit: parseInt(req.query.limit as string) || 10,
            startDate: req.query.startDate as string,
            endDate: req.query.endDate as string,
        };
        const result = await attendanceService.getHistory(req.user!.id, query);
        res.json({ success: true, ...result });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: { message: sanitizeErrorMessage(error, "Gagal memproses data"), code: "INTERNAL_ERROR" },
        });
    }
});

/**
 * GET /api/attendance/stats
 * User's attendance statistics
 */
router.get("/stats", requireAuth, async (req: Request, res: Response) => {
    try {
        const startDate = req.query.startDate as string;
        const endDate = req.query.endDate as string;
        // Month/Year might still be passed by old clients or if needed, but we focus on start/end
        // If frontend sends month/year, we can also parse them, but service signature update handles it.
        const stats = await attendanceService.getStats(req.user!.id, undefined, undefined, startDate, endDate);
        res.json({ success: true, data: stats });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: { message: sanitizeErrorMessage(error, "Gagal memproses data"), code: "INTERNAL_ERROR" },
        });
    }
});

/**
 * GET /api/attendance/today-status
 * Get current user's check-in/permit status for today
 */
router.get("/today-status", requireAuth, async (req: Request, res: Response) => {
    try {
        const status = await attendanceService.getMyTodayStatus(req.user!.id);
        res.json({ success: true, data: status });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: { message: sanitizeErrorMessage(error, "Gagal memproses data"), code: "INTERNAL_ERROR" },
        });
    }
});

/**
 * GET /api/attendance/global
 * (Admin) All users' daily prayer attendance grid
 */
router.get("/global", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
        const query = {
            page: parseInt(req.query.page as string) || 1,
            limit: parseInt(req.query.limit as string) || 10,
            date: req.query.date as string,
            startDate: req.query.startDate as string,
            endDate: req.query.endDate as string,
            role: req.query.role as string,
            search: req.query.search as string,
        };
        const result = await attendanceService.getGlobalRecap(query);
        res.json({ success: true, ...result });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: { message: sanitizeErrorMessage(error, "Gagal memproses data"), code: "INTERNAL_ERROR" },
        });
    }
});

router.get("/report", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
        const query = {
            startDate: req.query.startDate as string,
            endDate: req.query.endDate as string,
            role: req.query.role as string,
        };
        const result = await attendanceService.getReport(query);
        res.json({ success: true, ...result });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: { message: sanitizeErrorMessage(error, "Gagal memproses data"), code: "INTERNAL_ERROR" },
        });
    }
});

/**
 * DELETE /api/attendance/daily
 * (Admin) Reset daily attendance
 */
router.delete("/daily", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
        const date = (req.query.date as string) || new Date().toISOString().split("T")[0];
        await attendanceService.resetDailyAttendance(date);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: { message: sanitizeErrorMessage(error, "Gagal memproses data"), code: "INTERNAL_ERROR" },
        });
    }
});

/**
 * POST /api/attendance/bulk
 * (Admin) Bulk check-in/attendance input
 */
router.post("/bulk", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
        const data = validateBody(bulkCheckInSchema, req, res);
        if (!data) return;

        const results = await attendanceService.bulkCheckIn(req.user!.id, data);

        res.json({
            success: true,
            data: results,
            message: `Processed ${data.userIds.length} users.`
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: { message: sanitizeErrorMessage(error, "Gagal memproses data"), code: "BULK_CHECKIN_FAILED" },
        });
    }
});

export default router;
