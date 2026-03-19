import { Router, Request, Response } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware.js";
import { sunnahService } from "../services/sunnah.service.js";
import { sanitizeErrorMessage } from "../middleware/error-sanitizer.js";
import { validateBody, submitSunnahSchema } from "../middleware/validators.js";

const router = Router();

/**
 * GET /api/sunnah/today
 * Get current user's sunnah practices for today
 */
router.get("/today", requireAuth, async (req: Request, res: Response) => {
    try {
        const date = new Date().toISOString().split("T")[0];
        const records = await sunnahService.getUserSunnah(req.user!.id, date);
        res.json({ success: true, data: records });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: { message: sanitizeErrorMessage(error) },
        });
    }
});

/**
 * POST /api/sunnah
 * Submit or Toggle a practice
 * Body: { practice: 'tahajud', performed: true/false, date?: 'YYYY-MM-DD' }
 */
router.post("/", requireAuth, async (req: Request, res: Response) => {
    try {
        const data = validateBody(submitSunnahSchema, req, res);
        if (!data) return;
        const targetDate = data.date || new Date().toISOString().split("T")[0];

        const record = await sunnahService.submitSunnah({
            userId: req.user!.id,
            date: targetDate,
            practice: data.practice,
            performed: data.performed
        });
        res.json({ success: true, data: record });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: { message: sanitizeErrorMessage(error) },
        });
    }
});

/**
 * GET /api/sunnah/report
 * (Admin) Get report
 */
router.get("/report", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, role } = req.query as any;
        const report = await sunnahService.getReport({
            startDate: startDate || new Date().toISOString().split("T")[0],
            endDate: endDate || new Date().toISOString().split("T")[0],
            role
        });
        res.json({ success: true, ...report });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: { message: sanitizeErrorMessage(error) },
        });
    }
});

export default router;
