const db = require('./db');

async function updateDB() {
    try {
        // 1. Alter Users Table
        console.log("Checking if users table has name column...");
        const [columns] = await db.execute("SHOW COLUMNS FROM users LIKE 'name'");
        if (columns.length === 0) {
            console.log("Adding name column to users table...");
            await db.execute("ALTER TABLE users ADD COLUMN name VARCHAR(100) DEFAULT 'Unknown'");
        } else {
            console.log("name column already exists in users table.");
        }

        // Update User Names
        console.log("Updating User Names...");
        await db.execute("UPDATE users SET name='Admin Dr. Rajesh' WHERE email='admin@hospital.com'");
        await db.execute("UPDATE users SET name='Dr. Anil' WHERE email='joe@hospital.com'");
        await db.execute("UPDATE users SET name='Dr. Priya' WHERE email='sarah@hospital.com'");
        await db.execute("UPDATE users SET name='Dr. Vikram' WHERE email='mike@hospital.com'");

        // 2. Update Doctor Names
        console.log("Updating Doctor Names to Indian Names...");
        await db.execute("UPDATE doctors SET name='Dr. Rajesh' WHERE doctor_id=1"); // Cardiology
        await db.execute("UPDATE doctors SET name='Dr. Priya' WHERE doctor_id=2"); // Neurology
        await db.execute("UPDATE doctors SET name='Dr. Anil' WHERE doctor_id=3"); // General
        await db.execute("UPDATE doctors SET name='Dr. Kavita' WHERE doctor_id=4"); // Emergency
        await db.execute("UPDATE doctors SET name='Dr. Sanjay' WHERE doctor_id=5"); // Orthopedic
        await db.execute("UPDATE doctors SET name='Dr. Neha' WHERE doctor_id=6"); // Cardiology

        console.log("Database Mock Update Successful!");
    } catch (err) {
        console.error("Error updating DB:", err);
    } finally {
        process.exit();
    }
}

updateDB();
