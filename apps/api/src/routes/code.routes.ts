import { Router, Request, Response } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware.js";
import { codeService } from "../services/code.service.js";

const router = Router();

/**
 * GET /api/codes
 * (Admin) List all access codes
 */
router.get("/", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
        const query = {
            page: parseInt(req.query.page as string) || 1,
            limit: parseInt(req.query.limit as string) || 10,
            search: req.query.search as string,
            role: req.query.role as string,
            status: req.query.status as string,
        };
        const result = await codeService.listCodes(query);
        res.json({ success: true, ...result });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: { message: error.message, code: "INTERNAL_ERROR" },
        });
    }
});

/**
 * POST /api/codes
 * (Admin) Create a new access code
 */
router.post("/", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
        const code = await codeService.createCode(req.body);
        res.status(201).json({ success: true, data: code });
    } catch (error: any) {
        const status = error.message.includes("already exists") ? 409 : 400;
        res.status(status).json({
            success: false,
            error: { message: error.message, code: "CREATE_FAILED" },
        });
    }
});

/**
 * PUT /api/codes/:id
 * (Admin) Update access code
 */
router.put("/:id", requireAuth, requireAdmin, async (req: Request<{ id: string }>, res: Response) => {
    try {
        const code = await codeService.updateCode(req.params.id, req.body);
        res.json({ success: true, data: code });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            error: { message: error.message, code: "UPDATE_FAILED" },
        });
    }
});

/**
 * DELETE /api/codes/:id
 * (Admin) Delete access code
 */
router.delete("/:id", requireAuth, requireAdmin, async (req: Request<{ id: string }>, res: Response) => {
    try {
        const code = await codeService.deleteCode(req.params.id);
        res.json({ success: true, data: code });
    } catch (error: any) {
        res.status(404).json({
            success: false,
            error: { message: error.message, code: "NOT_FOUND" },
        });
    }
});

export default router;
