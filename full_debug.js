const db = require('./db');

async function debug() {
    console.log('--- DOCTORS ---');
    db.query('SELECT doctor_id, name, specialization, status FROM doctors', (err, rows) => {
        if (err) console.error(err);
        else console.table(rows);

        console.log('--- ROOMS ---');
        db.query('SELECT room_id, room_number, type, status FROM rooms', (err, rows) => {
            if (err) console.error(err);
            else console.table(rows);

            console.log('--- ADMITTED PATIENTS ---');
            db.query('SELECT patient_id, name, status, doctor_id, room_id FROM patients WHERE status="Admitted"', (err, rows) => {
                if (err) console.error(err);
                else console.table(rows);
                process.exit(0);
            });
        });
    });
}

debug();
