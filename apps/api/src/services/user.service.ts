import db from "../db/index.js";
import * as schema from "../db/schema.js";
import { eq, and, or, ilike, count, asc, desc } from "drizzle-orm";

interface ListUsersQuery {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
}

interface CreateUserData {
    name: string;
    email: string;
    phone?: string;
    nis?: string;
    address?: string;
    role: "admin" | "santri" | "staff" | "guest";
    category?: string;
    status?: "active" | "on_leave" | "inactive";
    waliName?: string;
    asramaId?: string;
}

interface UpdateUserData extends Partial<CreateUserData> { }

export const userService = {
    /**
     * Get a user's full profile with asrama info
     */
    async getProfile(userId: string) {
        const [userRecord] = await db
            .select({
                id: schema.user.id,
                name: schema.user.name,
                email: schema.user.email,
                phone: schema.user.phone,
                nis: schema.user.nis,
                address: schema.user.address,
                role: schema.user.role,
                category: schema.user.category,
                status: schema.user.status,
                image: schema.user.image,
                waliName: schema.user.waliName,
                deviceId: schema.user.deviceId,
                joinedAt: schema.user.joinedAt,
                createdAt: schema.user.createdAt,
                asramaName: schema.asrama.name,
                asramaRoom: schema.asrama.roomNumber,
            })
            .from(schema.user)
            .leftJoin(schema.asrama, eq(schema.user.asramaId, schema.asrama.id))
            .where(eq(schema.user.id, userId))
            .limit(1);

        if (!userRecord) {
            throw new Error("User not found");
        }

        return userRecord;
    },

    /**
     * Update a user's profile
     */
    async updateProfile(userId: string, data: UpdateUserData) {
        const [updated] = await db
            .update(schema.user)
            .set({
                ...data,
                updatedAt: new Date(),
            })
            .where(eq(schema.user.id, userId))
            .returning();

        if (!updated) {
            throw new Error("User not found");
        }

        return updated;
    },

    /**
     * Update user avatar
     */
    async updateAvatar(userId: string, imageUrl: string) {
        const [updated] = await db
            .update(schema.user)
            .set({
                image: imageUrl,
                updatedAt: new Date(),
            })
            .where(eq(schema.user.id, userId))
            .returning();

        if (!updated) {
            throw new Error("User not found");
        }

        return updated;
    },

    /**
     * (Admin) List all users with pagination and filtering
     */
    async listUsers(query: ListUsersQuery) {
        const page = query.page || 1;
        const limit = query.limit || 10;
        const offset = (page - 1) * limit;

        let whereConditions: any[] = [];

        if (query.role) {
            whereConditions.push(eq(schema.user.role, query.role as any));
        }
        if (query.status) {
            whereConditions.push(eq(schema.user.status, query.status as any));
        }
        if (query.search) {
            whereConditions.push(
                or(
                    ilike(schema.user.name, `%${query.search}%`),
                    ilike(schema.user.email, `%${query.search}%`),
                    ilike(schema.user.nis ?? "", `%${query.search}%`)
                )
            );
        }

        const whereClause =
            whereConditions.length > 0 ? and(...whereConditions) : undefined;

        const users = await db
            .select({
                id: schema.user.id,
                name: schema.user.name,
                email: schema.user.email,
                nis: schema.user.nis,
                role: schema.user.role,
                category: schema.user.category,
                status: schema.user.status,
                image: schema.user.image,
                asramaName: schema.asrama.name,
                asramaRoom: schema.asrama.roomNumber,
            })
            .from(schema.user)
            .leftJoin(schema.asrama, eq(schema.user.asramaId, schema.asrama.id))
            .where(whereClause)
            .orderBy(asc(schema.user.name))
            .limit(limit)
            .offset(offset);

        const [totalResult] = await db
            .select({ total: count() })
            .from(schema.user)
            .where(whereClause);

        return {
            data: users,
            pagination: {
                page,
                limit,
                total: Number(totalResult.total),
                totalPages: Math.ceil(Number(totalResult.total) / limit),
            },
        };
    },

    /**
     * (Admin) Create a new user with auto-generated access code
     */
    async createUser(data: CreateUserData) {
        const id = crypto.randomUUID();

        // 1. Create User
        const [newUser] = await db
            .insert(schema.user)
            .values({
                id,
                name: data.name,
                email: data.email,
                phone: data.phone,
                nis: data.nis,
                address: data.address,
                role: data.role,
                category: data.category,
                status: data.status || "active",
                waliName: data.waliName,
                asramaId: data.asramaId,
            })
            .returning();

        // 2. Auto-generate Access Code (Format: NAME-INIT-RANDOM)
        // e.g., "AF-8392"
        const initials = data.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .substring(0, 2)
            .toUpperCase();
        const random = Math.floor(1000 + Math.random() * 9000); // 4 digit random
        const codeString = `${initials}-${random}`;

        await db.insert(schema.accessCode).values({
            code: codeString,
            userId: id,
            status: "active",
            // expiresAt can be null (forever) or set default
        });

        // Attach code to response if needed, but for now just returning user is standard
        return { ...newUser, accessCode: codeString };
    },

    /**
     * (Admin) Get user by ID
     */
    async getUserById(id: string) {
        return this.getProfile(id);
    },

    /**
     * (Admin) Update a user
     */
    async updateUser(id: string, data: UpdateUserData) {
        return this.updateProfile(id, data);
    },

    /**
     * (Admin) Delete a user
     */
    async deleteUser(id: string) {
        const [deleted] = await db
            .delete(schema.user)
            .where(eq(schema.user.id, id))
            .returning();

        if (!deleted) {
            throw new Error("User not found");
        }

        return deleted;
    },
};
