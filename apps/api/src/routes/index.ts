import { Router } from "express";
import authRoutes from "./auth.routes.js";
import recitationRoutes from "./recitation.routes.js";
import userRoutes from "./user.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/recitation", recitationRoutes);

export default router;
