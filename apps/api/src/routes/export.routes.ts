import { Router, Request, Response } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware.js";
import { exportService } from "../services/export.service.js";
import { sanitizeErrorMessage } from "../middleware/error-sanitizer.js";
import { validateBody, generateReportSchema } from "../middleware/validators.js";
import fs from "fs";

const router = Router();

/**
 * POST /api/exports/generate
 * (Admin) Generate and download a report
 */
router.post("/generate", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
        // ✅ Security Fix: validate + explicit field extraction
        const data = validateBody(generateReportSchema, req, res);
        if (!data) return;
        const record = await exportService.generateReport({
            generatedBy: req.user!.id,
            ...data,
        });
        res.status(201).json({ success: true, data: record });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            error: { message: sanitizeErrorMessage(error), code: "GENERATE_FAILED" },
        });
    }
});

/**
 * GET /api/exports/history
 * (Admin) List past exports
 */
router.get("/history", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
        const query = {
            page: parseInt(req.query.page as string) || 1,
            limit: parseInt(req.query.limit as string) || 10,
        };
        const result = await exportService.getHistory(query);
        res.json({ success: true, ...result });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: { message: sanitizeErrorMessage(error), code: "INTERNAL_ERROR" },
        });
    }
});

/**
 * GET /api/exports/:id/download
 * (Admin) Download a generated export file
 */
router.get("/:id/download", requireAuth, requireAdmin, async (req: Request<{ id: string }>, res: Response) => {
    try {
        const record = await exportService.getById(req.params.id);
        const filePath = exportService.getFilePath(record.filename);

        // Check if file exists on disk
        if (!fs.existsSync(filePath)) {
            res.status(404).json({
                success: false,
                error: { message: "Export file not found on disk", code: "FILE_NOT_FOUND" },
            });
            return;
        }

        // Stream the file to the client
        const contentType = record.format === "pdf"
            ? "application/pdf"
            : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

        res.setHeader("Content-Type", contentType);
        res.setHeader("Content-Disposition", `attachment; filename="${record.filename}"`);
        res.download(filePath, record.filename);
    } catch (error: any) {
        res.status(404).json({
            success: false,
            error: { message: sanitizeErrorMessage(error), code: "NOT_FOUND" },
        });
    }
});

export default router;

