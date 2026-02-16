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
// Pastikan FRONTEND_URL di .env Vercel backend kamu sudah benar!
app.use(
    cors({
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"], // Tambahkan ini agar lebih aman
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

// Request logging
app.use(morgan("dev"));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Health Check & Root ─────────────────────────────────────────────

// Tambahkan route "/" sederhana agar kalau dibuka di browser tidak 404
app.get("/", (_req, res) => {
    res.send("🚀 Manah Tracking API is Running!");
});

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

// Semua route API masuk ke sini
app.use("/api", apiRoutes);
// Khusus Better Auth jika path-nya belum tercover di apiRoutes
// app.use("/api/auth", ...); // (Biasanya sudah ada di dalam apiRoutes)

// ─── Error Handler (must be last) ────────────────────────────────────

app.use(errorHandler);

// ─── Start Server ────────────────────────────────────────────────────

// Vercel akan menangani ini secara otomatis, tapi biarkan untuk local dev
app.listen(PORT, () => {
    console.log(`\n🚀 Manah Tracking API running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || "development"}\n`);
});

// PENTING: Export default app agar Vercel bisa membacanya sebagai Serverless Function
export default app;