const db = require('./db');

// Try to discharge patient 1
const patientId = 1;

db.query(
    "SELECT doctor_id, room_id FROM patients WHERE patient_id=?",
    [patientId],
    (err, result) => {
        if (err) {
            console.error('Error selecting patient:', err);
            process.exit(1);
        }
        if (!result || result.length === 0) {
            console.log("Patient Not Found");
            process.exit(1);
        }

        const { doctor_id, room_id } = result[0];
        console.log(`Found patient ${patientId} with doctor ${doctor_id} and room ${room_id}`);

        db.query("UPDATE patients SET status='Discharged' WHERE patient_id=?", [patientId], (err) => {
            if (err) console.error('Error updating patient:', err);
            else console.log('Patient status updated to Discharged');

            if (doctor_id) {
                db.query("UPDATE doctors SET status='Available' WHERE doctor_id=?", [doctor_id], (err) => {
                    if (err) console.error('Error updating doctor:', err);
                    else console.log(`Doctor ${doctor_id} status updated to Available`);

                    if (room_id) {
                        db.query("UPDATE rooms SET status='Available' WHERE room_id=?", [room_id], (err) => {
                            if (err) console.error('Error updating room:', err);
                            else console.log(`Room ${room_id} status updated to Available`);
                            process.exit(0);
                        });
                    } else {
                        process.exit(0);
                    }
                });
            } else {
                process.exit(0);
            }
        });
    }
);
