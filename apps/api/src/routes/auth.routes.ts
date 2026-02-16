import { Router } from "express";
import { auth } from "../auth/index.js";
import { toNodeHandler } from "better-auth/node";

const router = Router();

/**
 * All Better Auth routes (including custom plugins like /login/code)
 * are handled by this catch-all handler.
 */
router.all("/*splat", (req, res) => {
    return toNodeHandler(auth)(req, res);
});

export default router;
