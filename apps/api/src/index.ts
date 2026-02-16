import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";

import apiRoutes from "./routes/index.js";
import { errorHandler } from "./middleware/error.middleware.js";

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────────────

// Security headers
app.use(helmet());

// CORS - allow frontend origin
app.use(
    cors({
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        credentials: true,
    })
);

// Request logging
app.use(morgan("dev"));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ────────────────────────────────────────────────────

app.get("/api/health", (_req, res) => {
    res.json({
        success: true,
        data: {
            status: "ok",
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        },
    });
});

// ─── API Routes ──────────────────────────────────────────────────────

app.use("/api", apiRoutes);

// ─── Error Handler (must be last) ────────────────────────────────────

app.use(errorHandler);

// ─── Start Server ────────────────────────────────────────────────────

app.listen(PORT, () => {
    console.log(`\n🚀 Manah Tracking API running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || "development"}\n`);
});

// ─── Static Files (Production Only) ──────────────────────────────────
// Serve frontend files if in production or if explicitly requested
if (process.env.NODE_ENV === 'production' || process.env.SERVE_STATIC === 'true') {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    // Assuming structure: apps/api/src/index.ts -> build -> apps/api/dist/index.js
    // We want to reach apps/web/dist from apps/api
    // Using process.cwd() is safer if we always run from apps/api root
    const clientBuildPath = path.join(process.cwd(), '../web/dist');

    console.log(`📂 Serving static files from: ${clientBuildPath}`);

    app.use(express.static(clientBuildPath));

    // Catch-all route for SPA (must be after API routes)
    app.get('*', (req, res) => {
        // Don't intercept API calls that weren't caught
        if (req.path.startsWith('/api')) {
            return res.status(404).json({ success: false, error: { message: "API endpoint not found" } });
        }
        res.sendFile(path.join(clientBuildPath, 'index.html'));
    });
}

export default app;

