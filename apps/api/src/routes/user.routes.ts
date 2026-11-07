import { Router, Request, Response } from "express";
import { requireAdmin, requireAuth } from "../middleware/auth.middleware.js";
import { sanitizeErrorMessage } from "../middleware/error-sanitizer.js";
import { userService } from "../services/user.service.js";

const router = Router();

router.get("/me", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
        const profile = await userService.getProfile(req.user!.id);
        res.json({ success: true, data: profile });
    } catch (error) {
        res.status(404).json({
            success: false,
            error: { message: sanitizeErrorMessage(error), code: "NOT_FOUND" },
        });
    }
});

export default router;
