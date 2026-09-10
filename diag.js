const db = require('./db');
const fs = require('fs');

async function debug() {
    try {
        const data = {};

        const [doctors] = await db.execute('SELECT doctor_id, name, specialization, status FROM doctors');
        data.doctors = doctors;

        const [rooms] = await db.execute('SELECT room_id, room_number, type, status FROM rooms');
        data.rooms = rooms;

        const [patients] = await db.execute('SELECT patient_id, name, status, doctor_id, room_id FROM patients');
        data.patients = patients;

        fs.writeFileSync('diag_results.json', JSON.stringify(data, null, 2));
        console.log('Results written to diag_results.json');
    } catch (err) {
        console.error('Debug Error:', err);
    } finally {
        process.exit(0);
    }
}

debug();
