import { Router, Request, Response } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware.js";
import { settingsService } from "../services/settings.service.js";
import { sanitizeErrorMessage } from "../middleware/error-sanitizer.js";
import { validateBody, updateSettingsSchema, prayerOffsetsSchema } from "../middleware/validators.js";

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
            error: { message: sanitizeErrorMessage(error), code: "INTERNAL_ERROR" },
        });
    }
});

/**
 * PUT /api/settings
 * (Admin) Update multiple system settings
 */
router.put("/", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
        const data = validateBody(updateSettingsSchema, req, res);
        if (!data) return;
        const updated = await settingsService.updateAll(data.settings, req.user!.id);
        res.json({ success: true, data: updated });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            error: { message: sanitizeErrorMessage(error), code: "UPDATE_FAILED" },
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
            error: { message: sanitizeErrorMessage(error), code: "INTERNAL_ERROR" },
        });
    }
});

/**
 * PUT /api/settings/prayer-offsets
 * (Admin) Update prayer time offsets
 */
router.put("/prayer-offsets", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
        const data = validateBody(prayerOffsetsSchema, req, res);
        if (!data) return;
        const offsets = await settingsService.updatePrayerOffsets(data);
        res.json({ success: true, data: offsets });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            error: { message: sanitizeErrorMessage(error), code: "UPDATE_FAILED" },
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
            error: { message: sanitizeErrorMessage(error), code: "RESET_FAILED" },
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
            error: { message: sanitizeErrorMessage(error), code: "UNBIND_FAILED" },
        });
    }
});

export default router;
