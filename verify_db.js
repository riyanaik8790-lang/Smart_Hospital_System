const db = require('./db');

db.query('SELECT COUNT(*) as count FROM doctors WHERE status="Available"', (err, results) => {
    if (err) {
        console.error('Database connection failed:', err);
        process.exit(1);
    }
    console.log('Available Doctors:', results[0].count);

    db.query('SELECT COUNT(*) as count FROM rooms WHERE status="Available"', (err, results) => {
        if (err) {
            console.error('Query failed:', err);
            process.exit(1);
        }
        console.log('Available Rooms:', results[0].count);
        process.exit(0);
    });
});
