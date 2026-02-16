import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { dashboardService } from "../services/dashboard.service.js";

const router = Router();

/**
 * GET /api/dashboard/prayer-times
 * Get today's prayer schedule
 */
router.get("/prayer-times", requireAuth, async (_req: Request, res: Response) => {
    try {
        const prayerTimes = await dashboardService.getPrayerTimes();
        res.json({ success: true, data: prayerTimes });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: { message: error.message, code: "INTERNAL_ERROR" },
        });
    }
});

/**
 * GET /api/dashboard/weekly-stats
 * Current user's weekly attendance percentage
 */
router.get("/weekly-stats", requireAuth, async (req: Request, res: Response) => {
    try {
        const stats = await dashboardService.getWeeklyStats(req.user!.id);
        res.json({ success: true, data: stats });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: { message: error.message, code: "INTERNAL_ERROR" },
        });
    }
});

/**
 * GET /api/dashboard/recent-activity
 * Current user's latest activity
 */
router.get("/recent-activity", requireAuth, async (req: Request, res: Response) => {
    try {
        const limit = parseInt(req.query.limit as string) || 5;
        const activities = await dashboardService.getRecentActivity(req.user!.id, limit);
        res.json({ success: true, data: activities });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: { message: error.message, code: "INTERNAL_ERROR" },
        });
    }
});

/**
 * PUT /api/dashboard/prayer-times
 * Update prayer times and offsets
 */
router.put("/prayer-times", requireAuth, async (req: Request, res: Response) => {
    try {
        const { updates } = req.body; // Expects { updates: { subuh: { time: "04:30", offset: 20 }, ... } }
        await dashboardService.updatePrayerTimes(updates);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: { message: error.message, code: "INTERNAL_ERROR" },
        });
    }
});

export default router;
