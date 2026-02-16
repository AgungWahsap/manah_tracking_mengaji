import { db } from "../../db/index.js";
import { user } from "../../db/schema.js";
import { ilike, or } from "drizzle-orm";
// import { confirm } from '@inquirer/prompts'; // We might not have this package, better stick to simple readline or just run it

// Since we might not have interactive prompt libs installed and we want to keep dependencies low:
// We will just execute but print what we are doing.
// The user should be careful when running this.

const clearDummy = async () => {
    console.log("🧹 Starting Dummy Data Cleanup...");

    try {
        // Find users to be deleted first for reporting
        const usersToDelete = await db
            .select({ id: user.id, name: user.name })
            .from(user)
            .where(
                or(
                    ilike(user.name, 'Santri%'),
                    ilike(user.name, 'Dummy%')
                )
            );

        if (usersToDelete.length === 0) {
            console.log("✅ No dummy users found (starting with 'Santri' or 'Dummy').");
            process.exit(0);
        }

        console.log(`⚠️ Found ${usersToDelete.length} dummy users to delete.`);
        // Note: Related data (attendance, access codes) will be deleted automatically via CASCADE in schema.

        // Perform deletion
        const deleted = await db
            .delete(user)
            .where(
                or(
                    ilike(user.name, 'Santri%'),
                    ilike(user.name, 'Dummy%')
                )
            )
            .returning({ id: user.id, name: user.name });

        console.log(`✅ Successfully deleted ${deleted.length} users and their related data.`);
        process.exit(0);

    } catch (error) {
        console.error("❌ Cleanup failed:", error);
        process.exit(1);
    }
};

clearDummy();
