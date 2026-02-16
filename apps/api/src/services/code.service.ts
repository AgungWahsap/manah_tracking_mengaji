import db from "../db/index.js";
import * as schema from "../db/schema.js";
import { eq, and, or, ilike, count, asc, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

interface ListCodesQuery {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
}

interface CreateCodeData {
    code: string;
    userId?: string;
    userData?: {
        name: string;
        email: string;
        role: "admin" | "santri" | "staff" | "guest";
        nis?: string;
    };
    status?: "active" | "suspended" | "temporary";
    expiresAt?: string;
}

interface UpdateCodeData extends Partial<CreateCodeData> { }

export const codeService = {
    /**
     * (Admin) List all access codes with pagination and filtering
     */
    async listCodes(query: ListCodesQuery) {
        const page = query.page || 1;
        const limit = query.limit || 10;
        const offset = (page - 1) * limit;

        let whereConditions: any[] = [];

        if (query.status) {
            whereConditions.push(
                eq(schema.accessCode.status, query.status as any)
            );
        }

        if (query.search) {
            whereConditions.push(
                or(
                    ilike(schema.accessCode.code, `%${query.search}%`),
                    ilike(schema.user.name, `%${query.search}%`)
                )
            );
        }

        const whereClause =
            whereConditions.length > 0 ? and(...whereConditions) : undefined;

        const codesQuery = await db
            .select({
                id: schema.accessCode.id,
                code: schema.accessCode.code,
                status: schema.accessCode.status,
                assignedAt: schema.accessCode.assignedAt,
                expiresAt: schema.accessCode.expiresAt,
                createdAt: schema.accessCode.createdAt,
                userId: schema.user.id,
                userName: schema.user.name,
                userEmail: schema.user.email,
                userRole: schema.user.role,
                userImage: schema.user.image,
                asramaName: schema.asrama.name,
                asramaRoom: schema.asrama.roomNumber,
            })
            .from(schema.accessCode)
            .leftJoin(schema.user, eq(schema.accessCode.userId, schema.user.id))
            .leftJoin(schema.asrama, eq(schema.user.asramaId, schema.asrama.id))
            .where(whereClause)
            .orderBy(desc(schema.accessCode.createdAt))
            .limit(limit)
            .offset(offset);

        // Transform to match frontend expectation (nested user object)
        const codes = codesQuery.map(row => ({
            id: row.id,
            code: row.code,
            status: row.status,
            assignedAt: row.assignedAt,
            expiresAt: row.expiresAt,
            createdAt: row.createdAt,
            user: row.userId ? {
                id: row.userId,
                name: row.userName,
                email: row.userEmail,
                role: row.userRole,
                image: row.userImage,
                asrama: row.asramaName ? {
                    name: row.asramaName,
                    room: row.asramaRoom
                } : null
            } : null
        }));

        const [totalResult] = await db
            .select({ total: count() })
            .from(schema.accessCode)
            .leftJoin(schema.user, eq(schema.accessCode.userId, schema.user.id))
            .where(whereClause);

        return {
            data: codes,
            pagination: {
                page,
                limit,
                total: Number(totalResult?.total || 0),
                totalPages: Math.ceil(Number(totalResult?.total || 0) / limit),
            },
        };
    },

    /**
     * (Admin) Create a new access code
     */
    async createCode(data: CreateCodeData) {
        // Check if code already exists
        const existing = await db
            .select()
            .from(schema.accessCode)
            .where(eq(schema.accessCode.code, data.code.toUpperCase()))
            .limit(1);

        if (existing.length > 0) {
            throw new Error("Access code already exists");
        }

        let userId = data.userId;

        // If userData provided, create user first
        if (data.userData) {
            // Check if email exists
            const existingUser = await db
                .select()
                .from(schema.user)
                .where(eq(schema.user.email, data.userData.email))
                .limit(1);

            if (existingUser.length > 0) {
                // Use existing user
                userId = existingUser[0].id;
            } else {
                // Create new user
                userId = randomUUID();
                await db.insert(schema.user).values({
                    id: userId,
                    name: data.userData.name,
                    email: data.userData.email,
                    role: data.userData.role,
                    nis: data.userData.nis,
                    status: "active",
                });
            }
        }

        const [newCode] = await db
            .insert(schema.accessCode)
            .values({
                code: data.code.toUpperCase(),
                userId: userId,
                status: data.status || "active",
                expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
            })
            .returning();

        return newCode;
    },

    /**
     * (Admin) Update an access code
     */
    async updateCode(id: string, data: UpdateCodeData) {
        const updateValues: any = {};

        if (data.code) updateValues.code = data.code.toUpperCase();
        if (data.userId !== undefined) updateValues.userId = data.userId;
        if (data.status) updateValues.status = data.status;
        if (data.expiresAt !== undefined)
            updateValues.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;

        const [updated] = await db
            .update(schema.accessCode)
            .set(updateValues)
            .where(eq(schema.accessCode.id, id))
            .returning();

        if (!updated) {
            throw new Error("Access code not found");
        }

        return updated;
    },

    /**
     * (Admin) Delete an access code
     */
    async deleteCode(id: string) {
        const [deleted] = await db
            .delete(schema.accessCode)
            .where(eq(schema.accessCode.id, id))
            .returning();

        if (!deleted) {
            throw new Error("Access code not found");
        }

        return deleted;
    },
};
