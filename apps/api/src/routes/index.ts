import { Router } from "express";
import authRoutes from "./auth.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import attendanceRoutes from "./attendance.routes.js";
import userRoutes from "./user.routes.js";
import codeRoutes from "./code.routes.js";
import exportRoutes from "./export.routes.js";
import settingsRoutes from "./settings.routes.js";
import sunnahRoutes from "./sunnah.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/users", userRoutes);
router.use("/codes", codeRoutes);
router.use("/exports", exportRoutes);
router.use("/settings", settingsRoutes);
router.use("/sunnah", sunnahRoutes);

export default router;
