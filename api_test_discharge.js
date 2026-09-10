const db = require('./db');
const axios = require('axios');

async function testDischarge() {
    try {
        // Find an admitted patient
        db.query("SELECT patient_id FROM patients WHERE status='Admitted' LIMIT 1", async (err, result) => {
            if (err) {
                console.error("DB Error:", err);
                process.exit(1);
            }
            if (!result || result.length === 0) {
                console.log("No admitted patients found to test discharge.");
                process.exit(0);
            }

            const patientId = result[0].patient_id;
            console.log(`Attempting to discharge patient ID: ${patientId} via API...`);

            try {
                const res = await axios.put(`http://localhost:5000/discharge/${patientId}`);
                console.log("Response Status:", res.status);
                console.log("Response Data:", res.data);

                // Verify in DB
                db.query("SELECT status FROM patients WHERE patient_id=?", [patientId], (err, res2) => {
                    console.log("Final DB Status:", res2[0].status);
                    process.exit(0);
                });
            } catch (apiErr) {
                console.error("API Error:", apiErr.response ? apiErr.response.data : apiErr.message);
                process.exit(1);
            }
        });
    } catch (err) {
        console.error("Unexpected Error:", err);
        process.exit(1);
    }
}

testDischarge();
