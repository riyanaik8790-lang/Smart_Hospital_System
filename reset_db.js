const db = require('./db');

async function reset() {
    try {
        await db.execute("UPDATE doctors SET status='Available'");
        console.log('All doctors set to Available');

        await db.execute("UPDATE rooms SET status='Available'");
        console.log('All rooms set to Available');

        await db.execute("UPDATE patients SET status='Discharged' WHERE status='Admitted'");
        console.log('All patients set to Discharged');
    } catch (err) {
        console.error('Reset Error:', err);
    } finally {
        process.exit(0);
    }
}

reset();
