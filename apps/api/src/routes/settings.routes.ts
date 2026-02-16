import { Router, Request, Response } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware.js";
import { settingsService } from "../services/settings.service.js";

const router = Router();

/**
 * GET /api/settings
 * (Admin) Get all system settings
 */
router.get("/", requireAuth, requireAdmin, async (_req: Request, res: Response) => {
    try {
        const settings = await settingsService.getAll();
        res.json({ success: true, data: settings });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: { message: error.message, code: "INTERNAL_ERROR" },
        });
    }
});

/**
 * PUT /api/settings
 * (Admin) Update multiple system settings
 */
router.put("/", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
        const { settings } = req.body;
        const updated = await settingsService.updateAll(settings, req.user!.id);
        res.json({ success: true, data: updated });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            error: { message: error.message, code: "UPDATE_FAILED" },
        });
    }
});

/**
 * GET /api/settings/prayer-offsets
 * Get prayer time offsets
 */
router.get("/prayer-offsets", requireAuth, async (_req: Request, res: Response) => {
    try {
        const offsets = await settingsService.getPrayerOffsets();
        res.json({ success: true, data: offsets });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: { message: error.message, code: "INTERNAL_ERROR" },
        });
    }
});

/**
 * PUT /api/settings/prayer-offsets
 * (Admin) Update prayer time offsets
 */
router.put("/prayer-offsets", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
        const offsets = await settingsService.updatePrayerOffsets(req.body);
        res.json({ success: true, data: offsets });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            error: { message: error.message, code: "UPDATE_FAILED" },
        });
    }
});

/**
 * POST /api/settings/reset-daily-attendance
 * (Admin) Danger: Reset today's attendance data
 */
router.post("/reset-daily-attendance", requireAuth, requireAdmin, async (_req: Request, res: Response) => {
    try {
        const result = await settingsService.resetDailyAttendance();
        res.json({ success: true, data: result });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: { message: error.message, code: "RESET_FAILED" },
        });
    }
});

/**
 * POST /api/settings/unbind-all-devices
 * (Admin) Danger: Unbind all devices
 */
router.post("/unbind-all-devices", requireAuth, requireAdmin, async (_req: Request, res: Response) => {
    try {
        const result = await settingsService.unbindAllDevices();
        res.json({ success: true, data: result });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: { message: error.message, code: "UNBIND_FAILED" },
        });
    }
});

export default router;
