import { Router, Request, Response } from "express";
import { requireAdmin, requireAuth } from "../middleware/auth.middleware.js";
import { sanitizeErrorMessage } from "../middleware/error-sanitizer.js";
import {
    recitationAttendanceQuerySchema,
    recitationAttendanceSchema,
    recitationRecapQuerySchema,
    recitationScheduleSchema,
    recitationStudentSchema,
    updateRecitationStudentSchema,
    validateBody,
    validateQuery,
} from "../middleware/validators.js";
import { recitationService } from "../services/recitation.service.js";

const router = Router();
router.use(requireAuth, requireAdmin);

router.get("/sessions", async (_req: Request, res: Response) => {
    try {
        res.json({ success: true, data: await recitationService.getSessions() });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: { message: sanitizeErrorMessage(error), code: "RECITATION_SESSIONS_FAILED" },
        });
    }
});

router.put("/sessions", async (req: Request, res: Response) => {
    try {
        const data = validateBody(recitationScheduleSchema, req, res);
        if (!data) return;
        const sessions = await recitationService.updateSessions(data.updates);
        res.json({ success: true, data: sessions });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: { message: sanitizeErrorMessage(error), code: "RECITATION_SCHEDULE_UPDATE_FAILED" },
        });
    }
});

router.get("/students", async (req: Request, res: Response) => {
    try {
        const search = typeof req.query.search === "string" ? req.query.search : undefined;
        const includeInactive = req.query.includeInactive === "true";
        const students = await recitationService.listStudents(search, includeInactive);
        res.json({ success: true, data: students });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: { message: sanitizeErrorMessage(error), code: "RECITATION_STUDENTS_FAILED" },
        });
    }
});

router.post("/students", async (req: Request, res: Response) => {
    try {
        const data = validateBody(recitationStudentSchema, req, res);
        if (!data) return;
        const student = await recitationService.createStudent(data);
        res.status(201).json({ success: true, data: student });
    } catch (error) {
        const status = (error as { code?: string }).code === "23505" ? 409 : 500;
        res.status(status).json({
            success: false,
            error: {
                message: status === 409 ? "NIS tersebut sudah terdaftar" : sanitizeErrorMessage(error),
                code: "RECITATION_STUDENT_CREATE_FAILED",
            },
        });
    }
});

router.patch("/students/:id", async (req: Request<{ id: string }>, res: Response) => {
    try {
        const data = validateBody(updateRecitationStudentSchema, req, res);
        if (!data) return;
        const student = await recitationService.updateStudent(req.params.id, data);
        res.json({ success: true, data: student });
    } catch (error) {
        const status = error instanceof Error && error.message === "Santri tidak ditemukan"
            ? 404
            : (error as { code?: string }).code === "23505" ? 409 : 500;
        res.status(status).json({
            success: false,
            error: {
                message: status === 409 ? "NIS tersebut sudah terdaftar" : sanitizeErrorMessage(error),
                code: "RECITATION_STUDENT_UPDATE_FAILED",
            },
        });
    }
});

router.get("/attendance", async (req: Request, res: Response) => {
    try {
        const query = validateQuery(recitationAttendanceQuerySchema, req, res);
        if (!query) return;
        const data = await recitationService.getSessionAttendance(query.date, query.sessionId);
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: { message: sanitizeErrorMessage(error), code: "RECITATION_ATTENDANCE_FAILED" },
        });
    }
});

router.put("/attendance", async (req: Request, res: Response) => {
    try {
        const data = validateBody(recitationAttendanceSchema, req, res);
        if (!data) return;
        const result = await recitationService.saveSessionAttendance(req.user!.id, data);
        res.json({ success: true, data: result });
    } catch (error) {
        const status = error instanceof Error && /santri|status santri/i.test(error.message) ? 400 : 500;
        res.status(status).json({
            success: false,
            error: { message: sanitizeErrorMessage(error), code: "RECITATION_ATTENDANCE_SAVE_FAILED" },
        });
    }
});

router.get("/recap", async (req: Request, res: Response) => {
    try {
        const query = validateQuery(recitationRecapQuerySchema, req, res);
        if (!query) return;
        if (query.startDate > query.endDate) {
            res.status(400).json({
                success: false,
                error: { message: "Tanggal mulai tidak boleh melebihi tanggal akhir", code: "VALIDATION_ERROR" },
            });
            return;
        }
        const result = await recitationService.getRecap(query.startDate, query.endDate, query.sessionId);
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: { message: sanitizeErrorMessage(error), code: "RECITATION_RECAP_FAILED" },
        });
    }
});

export default router;
