const db = require('./db');
const patientId = 10;

db.query(
    "SELECT doctor_id, room_id, status FROM patients WHERE patient_id=?",
    [patientId],
    (err, result) => {
        if (err) { console.error(err); process.exit(1); }
        if (!result || result.length === 0) { console.log("Patient Not Found"); process.exit(1); }

        const { doctor_id, room_id, status } = result[0];
        console.log(`Current status of patient ${patientId}: ${status}`);

        db.query("UPDATE patients SET status='Discharged' WHERE patient_id=?", [patientId], (err) => {
            if (err) console.error(err);
            else console.log('Patient status set to Discharged');

            if (doctor_id) {
                db.query("UPDATE doctors SET status='Available' WHERE doctor_id=?", [doctor_id], (err) => {
                    if (err) console.error(err);
                    else console.log(`Doctor ${doctor_id} set to Available`);
                });
            }

            if (room_id) {
                db.query("UPDATE rooms SET status='Available' WHERE room_id=?", [room_id], (err) => {
                    if (err) console.error(err);
                    else console.log(`Room ${room_id} set to Available`);
                    process.exit(0);
                });
            } else {
                process.exit(0);
            }
        });
    }
);
