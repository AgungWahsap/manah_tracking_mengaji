import { Router, Request, Response } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware.js";
import { userService } from "../services/user.service.js";
import { sanitizeErrorMessage } from "../middleware/error-sanitizer.js";
import { validateBody, updateProfileSchema, createUserSchema, updateUserSchema } from "../middleware/validators.js";

const router = Router();

/**
 * GET /api/users/me
 * Get current user's profile
 */
router.get("/me", requireAuth, async (req: Request, res: Response) => {
    try {
        const profile = await userService.getProfile(req.user!.id);
        res.json({ success: true, data: profile });
    } catch (error: any) {
        res.status(404).json({
            success: false,
            error: { message: sanitizeErrorMessage(error), code: "NOT_FOUND" },
        });
    }
});

/**
 * PUT /api/users/me
 * Update current user's profile
 */
router.put("/me", requireAuth, async (req: Request, res: Response) => {
    try {
        const data = validateBody(updateProfileSchema, req, res);
        if (!data) return;
        const updated = await userService.updateProfile(req.user!.id, data);
        res.json({ success: true, data: updated });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            error: { message: sanitizeErrorMessage(error), code: "UPDATE_FAILED" },
        });
    }
});

/**
 * PUT /api/users/me/avatar
 * Upload/update avatar
 */
router.put("/me/avatar", requireAuth, async (req: Request, res: Response) => {
    try {
        const { imageUrl } = req.body;
        const updated = await userService.updateAvatar(req.user!.id, imageUrl);
        res.json({ success: true, data: updated });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            error: { message: sanitizeErrorMessage(error), code: "AVATAR_UPDATE_FAILED" },
        });
    }
});

/**
 * GET /api/users
 * (Admin) List all users with pagination and filters
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
        const result = await userService.listUsers(query);
        res.json({ success: true, ...result });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: { message: sanitizeErrorMessage(error), code: "INTERNAL_ERROR" },
        });
    }
});

/**
 * POST /api/users
 * (Admin) Create a new user
 */
router.post("/", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
        const data = validateBody(createUserSchema, req, res);
        if (!data) return;
        const user = await userService.createUser(data);
        res.status(201).json({ success: true, data: user });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            error: { message: sanitizeErrorMessage(error), code: "CREATE_FAILED" },
        });
    }
});

/**
 * GET /api/users/:id
 * (Admin) Get user detail by ID
 */
router.get("/:id", requireAuth, requireAdmin, async (req: Request<{ id: string }>, res: Response) => {
    try {
        const user = await userService.getUserById(req.params.id);
        res.json({ success: true, data: user });
    } catch (error: any) {
        res.status(404).json({
            success: false,
            error: { message: sanitizeErrorMessage(error), code: "NOT_FOUND" },
        });
    }
});

/**
 * PUT /api/users/:id
 * (Admin) Update user by ID
 */
router.put("/:id", requireAuth, requireAdmin, async (req: Request<{ id: string }>, res: Response) => {
    try {
        const data = validateBody(updateUserSchema, req, res);
        if (!data) return;
        const user = await userService.updateUser(req.params.id, data);
        res.json({ success: true, data: user });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            error: { message: sanitizeErrorMessage(error), code: "UPDATE_FAILED" },
        });
    }
});

/**
 * DELETE /api/users/:id
 * (Admin) Delete user by ID
 */
router.delete("/:id", requireAuth, requireAdmin, async (req: Request<{ id: string }>, res: Response) => {
    try {
        const user = await userService.deleteUser(req.params.id);
        res.json({ success: true, data: user });
    } catch (error: any) {
        res.status(404).json({
            success: false,
            error: { message: sanitizeErrorMessage(error), code: "NOT_FOUND" },
        });
    }
});

export default router;
