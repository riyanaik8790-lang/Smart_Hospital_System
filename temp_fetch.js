const db = require('./db');
const fs = require('fs');

async function fetchRecords() {
    try {
        const [users] = await db.execute("SELECT * FROM users");
        const [doctors] = await db.execute("SELECT * FROM doctors");

        const data = { users, doctors };
        fs.writeFileSync('temp_fetch.json', JSON.stringify(data, null, 2), 'utf-8');
        console.log("Written to temp_fetch.json");
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}
fetchRecords();
