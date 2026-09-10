require("dotenv").config();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const SECRET_KEY = "hospital_secret_key";

const db = require("./db");
const verifyToken = require("./middleware/verifyToken");
const { requireRole } = require("./middleware/roleMiddleware");
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Frontend static serving setup will be added below


// =====================================================
// LOGIN SYSTEM
// =====================================================
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const [result] = await db.execute("SELECT * FROM users WHERE email=?", [email]);

    if (!result || result.length === 0)
      return res.status(404).json({ message: "User not found" });

    const user = result[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword)
      return res.status(401).json({ message: "Invalid Password" });

    const token = jwt.sign(
      { id: user.user_id, role: user.role },
      SECRET_KEY,
      { expiresIn: "8h" }
    );

    res.json({
      message: "Login Successful",
      token,
      role: user.role,
      name: user.name
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json(err);
  }
});

// =====================================================
// REGISTRATION SYSTEM
// =====================================================
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const hasValidPassword =
      typeof password === "string" &&
      password.length >= 8 &&
      /[A-Za-z]/.test(password) &&
      /\d/.test(password);

    if (!hasValidPassword) {
      return res.status(400).json({
        message: "Password must be at least 8 characters and include at least one letter and one number."
      });
    }

    const [existingUsers] = await db.execute(
      "SELECT user_id FROM users WHERE email=?",
      [email]
    );

    if (existingUsers && existingUsers.length > 0) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [insertResult] = await db.execute(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, role]
    );

    const token = jwt.sign(
      { id: insertResult.insertId, role },
      SECRET_KEY,
      { expiresIn: "8h" }
    );

    res.status(201).json({
      message: "Registration Successful",
      token,
      role,
      name
    });
  } catch (err) {
    console.error("Registration Error:", err);
    res.status(500).json({ message: "Registration failed" });
  }
});

// =====================================================
// DASHBOARD
// =====================================================
app.get("/dashboard", async (req, res) => {
  try {
    const stats = {};
    const queries = {
      totalDoctors: "SELECT COUNT(*) AS count FROM doctors",
      availableDoctors: "SELECT COUNT(*) AS count FROM doctors WHERE LOWER(status)='available'",
      busyDoctors: "SELECT COUNT(*) AS count FROM doctors WHERE LOWER(status)='busy'",
      totalRooms: "SELECT COUNT(*) AS count FROM rooms",
      availableRooms: "SELECT COUNT(*) AS count FROM rooms WHERE LOWER(status)='available'",
      occupiedRooms: "SELECT COUNT(*) AS count FROM rooms WHERE LOWER(status)='occupied'",
      emergencyAvailable: "SELECT COUNT(*) AS count FROM rooms WHERE LOWER(type)='emergency' AND LOWER(status)='available'",
      totalPatients: "SELECT COUNT(*) AS count FROM patients",
      admittedPatients: "SELECT COUNT(*) AS count FROM patients WHERE LOWER(status)='admitted'",
      criticalPatients: "SELECT COUNT(*) AS count FROM patients WHERE LOWER(priority_label)='critical' AND LOWER(status)='admitted'"
    };

    const keys = Object.keys(queries);
    const results = await Promise.all(keys.map(key => db.execute(queries[key])));

    results.forEach((result, index) => {
      stats[keys[index]] = result[0][0].count;
    });

    res.json(stats);
  } catch (err) {
    console.error("Dashboard Error:", err);
    res.status(500).json(err);
  }
});

// =====================================================
// EFFICIENCY DASHBOARD
// =====================================================
app.get("/api/efficiency", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const stats = {};
    const queries = {
      totalDoctors: "SELECT COUNT(*) AS count FROM doctors",
      busyDoctors: "SELECT COUNT(*) AS count FROM doctors WHERE LOWER(status)='busy'",
      totalRooms: "SELECT COUNT(*) AS count FROM rooms",
      occupiedRooms: "SELECT COUNT(*) AS count FROM rooms WHERE LOWER(status)='occupied'",
      totalPatients: "SELECT COUNT(*) AS count FROM patients",
      admittedPatients: "SELECT COUNT(*) AS count FROM patients WHERE LOWER(status)='admitted'",
      dischargedPatients: "SELECT COUNT(*) AS count FROM patients WHERE LOWER(status)='discharged'",
      emergencyAdmitted: "SELECT COUNT(*) AS count FROM patients WHERE LOWER(priority_label)='critical' AND LOWER(status)='admitted'"
    };

    const keys = Object.keys(queries);
    const results = await Promise.all(keys.map(key => db.execute(queries[key])));

    results.forEach((result, index) => {
      stats[keys[index]] = result[0][0].count;
    });

    // Calculate derived rates
    const bedOccupancyRate = stats.totalRooms > 0 ? (stats.occupiedRooms / stats.totalRooms) * 100 : 0;
    const doctorUtilizationRate = stats.totalDoctors > 0 ? (stats.busyDoctors / stats.totalDoctors) * 100 : 0;

    // Overall treatment efficiency (discharged / total patients)
    const treatmentEfficiency = stats.totalPatients > 0 ? (stats.dischargedPatients / stats.totalPatients) * 100 : 0;

    // Critical load (emergency / total admitted)
    const criticalLoad = stats.admittedPatients > 0 ? (stats.emergencyAdmitted / stats.admittedPatients) * 100 : 0;

    res.json({
      ...stats,
      bedOccupancyRate: Math.round(bedOccupancyRate),
      doctorUtilizationRate: Math.round(doctorUtilizationRate),
      treatmentEfficiency: Math.round(treatmentEfficiency),
      criticalLoad: Math.round(criticalLoad)
    });
  } catch (err) {
    console.error("Efficiency API Error:", err);
    res.status(500).json({ message: "Error fetching efficiency data" });
  }
});


// =====================================================
// NORMAL PATIENT ADMISSION
// =====================================================

app.post("/add-patient", verifyToken, requireRole("admin", "receptionist"), async (req, res) => {
  try {
    const { name, age, category, priorityLevel, priorityLabel } = req.body;

    // 1. Find Room
    const [roomResult] = await db.execute(
      "SELECT * FROM rooms WHERE LOWER(type)!='emergency' AND LOWER(status)='available' LIMIT 1"
    );

    if (!roomResult || roomResult.length === 0)
      return res.send("No Rooms Available");

    const room = roomResult[0];

    // 2. Find Specialist Doctor
    let [docResult] = await db.execute(
      "SELECT * FROM doctors WHERE LOWER(specialization)=LOWER(?) AND LOWER(status)='available' LIMIT 1",
      [category]
    );

    let doctor;
    if (!docResult || docResult.length === 0) {
      // FALLBACK: Find ANY available doctor
      const [fallbackResult] = await db.execute(
        "SELECT * FROM doctors WHERE LOWER(status)='available' LIMIT 1"
      );
      if (!fallbackResult || fallbackResult.length === 0) {
        return res.send("No Doctor Available for this Category or Hospital");
      }
      doctor = fallbackResult[0];
    } else {
      doctor = docResult[0];
    }

    // 3. Admit
    await admitPatient(res, name, age, category, priorityLevel, priorityLabel, doctor, room);
  } catch (err) {
    console.error("Admission Error:", err);
    res.status(500).send("Server Error during admission");
  }
});

async function admitPatient(res, name, age, category, priorityLevel, priorityLabel, doctor, room) {
  console.log(`Admitting patient ${name} with Dr. ${doctor.name} in Room ${room.room_number}`);

  try {
    // We use a transaction or sequential awaits
    await db.execute(
      `INSERT INTO patients 
      (name, age, category, priority_level, priority_label, doctor_id, room_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Admitted')`,
      [name, age, category, priorityLevel || 3, priorityLabel || 'Medium', doctor.doctor_id, room.room_id]
    );

    await db.execute("UPDATE rooms SET status='Occupied' WHERE room_id=?", [room.room_id]);
    await db.execute("UPDATE doctors SET status='Busy' WHERE doctor_id=?", [doctor.doctor_id]);

    res.send(`Patient Admitted to Room ${room.room_number} under Dr. ${doctor.name} (${doctor.specialization})`);
  } catch (err) {
    console.error("admitPatient Helper Error:", err);
    throw err;
  }
}


// =====================================================
// EMERGENCY ADMISSION
// =====================================================

app.post("/emergency-admit", verifyToken, requireRole("admin", "receptionist"), async (req, res) => {
  try {
    console.log("Processing emergency admission...");

    const [roomResult] = await db.execute(
      "SELECT * FROM rooms WHERE LOWER(type)='emergency' AND LOWER(status)='available' LIMIT 1"
    );

    if (!roomResult || roomResult.length === 0)
      return res.send("🚨 No Emergency Rooms Available");

    const room = roomResult[0];

    const [docResult] = await db.execute(
      "SELECT * FROM doctors WHERE LOWER(specialization)='emergency' AND LOWER(status)='available' LIMIT 1"
    );

    const doctor = (docResult && docResult.length > 0) ? docResult[0] : null;

    await db.execute(
      `INSERT INTO patients 
      (name, age, category, priority_level, priority_label, doctor_id, room_id, status)
      VALUES (?, ?, 'Emergency', 1, 'Critical', ?, ?, 'Admitted')`,
      [
        req.body.name || "Emergency Case",
        req.body.age || 30,
        doctor ? doctor.doctor_id : null,
        room.room_id
      ]
    );

    await db.execute("UPDATE rooms SET status='Occupied' WHERE room_id=?", [room.room_id]);

    if (doctor) {
      await db.execute("UPDATE doctors SET status='Busy' WHERE doctor_id=?", [doctor.doctor_id]);
    }

    res.send(`🚑 Emergency Patient Admitted to Room ${room.room_number}`);
  } catch (err) {
    console.error("Emergency Admission Error:", err);
    res.status(500).send("Server Error during emergency admission");
  }
});


// =====================================================
// DISCHARGE
// =====================================================

app.put("/discharge/:id", verifyToken, requireRole("admin", "doctor"), async (req, res) => {
  try {
    const patientId = req.params.id;
    console.log(`Discharge attempt for patient ID: ${patientId}`);

    const [result] = await db.execute(
      "SELECT doctor_id, room_id, status FROM patients WHERE patient_id=?",
      [patientId]
    );

    if (!result || result.length === 0) {
      return res.status(404).send("Patient Not Found");
    }

    const patient = result[0];
    if (patient.status === 'Discharged') {
      return res.send("Patient is already discharged ✅");
    }

    const { doctor_id, room_id } = patient;

    // Start Discharge Process
    await db.execute("UPDATE patients SET status='Discharged' WHERE patient_id=?", [patientId]);

    if (doctor_id) {
      await db.execute("UPDATE doctors SET status='Available' WHERE doctor_id=?", [doctor_id]);
    }

    if (room_id) {
      await db.execute("UPDATE rooms SET status='Available' WHERE room_id=?", [room_id]);
    }

    console.log(`Patient ${patientId} discharged successfully.`);
    res.send("Patient Discharged ✅ Doctor & Room Released");
  } catch (err) {
    console.error("Discharge Error:", err);
    res.status(500).send("Server Error during discharge");
  }
});


// =====================================================
// DATA ROUTES
// =====================================================

app.get("/patients", verifyToken, requireRole("admin", "doctor", "nurse", "receptionist"), async (req, res) => {
  try {
    const sql = `
      SELECT 
        p.patient_id,
        p.name,
        p.status,
        p.priority_label,
        d.name AS doctor_name,
        r.room_number
      FROM patients p
      LEFT JOIN doctors d ON p.doctor_id = d.doctor_id
      LEFT JOIN rooms r ON p.room_id = r.room_id
      ORDER BY p.patient_id DESC
    `;
    const [result] = await db.execute(sql);
    res.json(result);
  } catch (err) {
    res.status(500).json(err);
  }
});

// ==========================
// UPDATED DOCTORS API ROUTE
// REPLACE YOUR OLD /doctors ROUTE WITH THIS
// ==========================

app.get("/doctors", verifyToken, requireRole("admin", "doctor", "nurse", "receptionist"), async (req, res) => {
  try {
    const [result] = await db.execute(`
      SELECT 
        doctor_id,
        name,
        specialization,
        status,
        phone,
        email
      FROM doctors
      ORDER BY doctor_id ASC
    `);

    res.json(result);

  } catch (err) {
    console.error("Error fetching doctors:", err);

    res.status(500).json({
      success: false,
      message: "Failed to fetch doctors",
      error: err.message
    });
  }
});

app.get("/rooms", verifyToken, requireRole("admin", "doctor", "nurse", "receptionist"), async (req, res) => {
  try {
    const [result] = await db.execute("SELECT * FROM rooms");
    res.json(result);
  } catch (err) {
    res.status(500).json(err);
  }
});


// =====================================================
// SERVE FRONTEND
// =====================================================
app.use(express.static(path.join(__dirname, "frontend/dist")));

app.get("/{*path}", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend/dist/index.html"));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
