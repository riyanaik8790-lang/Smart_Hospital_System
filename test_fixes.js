async function testFullFlow() {
    try {
        console.log("1. Testing Identity Login...");
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@hospital.com', password: 'password123' })
        });
        const loginData = await loginRes.json();
        console.log("Login Response Name:", loginData.name);

        console.log("\n2. Testing High Priority Patient Admission...");
        const admitRes = await fetch('http://localhost:5000/add-patient', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: "Test High Priority",
                age: 65,
                category: "Cardiology",
                priorityLevel: 1,
                priorityLabel: "High"
            })
        });
        console.log("Admission Response:", await admitRes.text());

        console.log("\n3. Testing Patients Table Retrieval...");
        const tableRes = await fetch('http://localhost:5000/patients');
        const tableData = await tableRes.json();
        const recentPatient = tableData[0];
        console.table([{
            "ID": recentPatient.patient_id,
            "Name": recentPatient.name,
            "Priority": recentPatient.priority_label,
            "Doctor": recentPatient.doctor_name,
            "Room": recentPatient.room_number
        }]);

        console.log("\nVerification Successful if Name=Admin Dr. Rajesh, Priority=High, Room/Doctor assigned!");
    } catch (e) {
        console.error("Test Failed:", e.message);
    }
}

testFullFlow();
