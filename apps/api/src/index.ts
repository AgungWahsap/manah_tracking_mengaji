import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
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

// CORS - allow frontend origin(s)
// ✅ Security Fix #7: Dukung multi-origin via comma-separated FRONTEND_URL
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
    .split(",")
    .map(s => s.trim());

app.use(
    cors({
        origin: (origin, callback) => {
            // Izinkan request tanpa origin (Vite proxy, mobile apps, curl) di development
            if (!origin && process.env.NODE_ENV !== "production") {
                return callback(null, true);
            }
            // Izinkan origin yang ada di daftar
            if (origin && allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            // Tolak origin yang tidak dikenal (return false, bukan throw Error)
            callback(null, false);
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
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

// ─── Rate Limiting ───────────────────────────────────────────────────

// ✅ Security Fix #9: Rate limit HANYA untuk login endpoint (anti brute-force)
// Tidak diterapkan ke GET /api/auth/get-session dll agar tidak mengganggu flow normal
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 menit
    max: 15, // Maksimal 15 percobaan login
    message: {
        success: false,
        error: {
            message: "Terlalu banyak percobaan login. Coba lagi dalam 15 menit.",
            code: "RATE_LIMITED",
        },
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Hanya hitung POST requests (login attempts)
    skip: (req) => req.method !== "POST",
});

// Terapkan rate limit hanya ke auth login path
app.use("/api/auth/login", authLimiter);

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