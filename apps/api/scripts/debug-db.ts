
// scripts/debug-db.ts
import db from '../src/db/index';
import * as schema from '../src/db/schema';
import { desc } from 'drizzle-orm';

async function main() {
    console.log('Checking recent sessions...');
    try {
        const sessions = await db.select().from(schema.session).orderBy(desc(schema.session.createdAt)).limit(3);
        console.log('Recent sessions:', JSON.stringify(sessions, null, 2));

        if (sessions.length > 0) {
            console.log('Checking user for latest session:', sessions[0].userId);
            const user = await db.select().from(schema.user).where(schema.eq(schema.user.id, sessions[0].userId));
            console.log('User:', JSON.stringify(user, null, 2));
        } else {
            console.log('No sessions found.');
        }
    } catch (err) {
        console.error('Error querying DB:', err);
    }
}

main().then(() => process.exit(0));
