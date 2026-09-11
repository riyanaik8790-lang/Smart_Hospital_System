require("dotenv").config();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const PDFDocument = require("pdfkit");
const SECRET_KEY = process.env.JWT_SECRET || "hospital_secret_key";

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
    const [result] = await db.execute("SELECT * FROM users WHERE email=? AND is_active=TRUE", [email]);

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
    const { name, email, password } = req.body;
    const role = String(req.body.role || "").trim().toLowerCase();
    const allowedRoles = new Set(["admin", "doctor", "nurse", "receptionist"]);

    if (!name?.trim() || !email?.trim() || !allowedRoles.has(role)) {
      return res.status(400).json({ message: "Please provide a name, email, and valid staff role." });
    }

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
      [name.trim(), email.trim().toLowerCase(), hashedPassword, role]
    );

    // Keep staff identity and doctor assignment linked so account safeguards
    // can find a doctor's appointments and admitted patients later.
    if (role === "doctor") {
      await db.execute(
        `INSERT INTO doctors (user_id, name, specialization, status, email)
         VALUES ($1, $2, 'General', 'Available', $3)`,
        [insertResult.insertId, name.trim(), email.trim().toLowerCase()]
      );
    }

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
app.get("/dashboard", verifyToken, async (req, res) => {
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
      stats[keys[index]] = Number(result[0][0].count) || 0;
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
async function getEfficiencyStats() {
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
    // node-postgres returns PostgreSQL COUNT(*) values as strings.
    stats[keys[index]] = Number(result[0][0].count) || 0;
  });

  const bedOccupancyRate = stats.totalRooms > 0 ? (stats.occupiedRooms / stats.totalRooms) * 100 : 0;
  const doctorUtilizationRate = stats.totalDoctors > 0 ? (stats.busyDoctors / stats.totalDoctors) * 100 : 0;
  const treatmentEfficiency = stats.totalPatients > 0 ? (stats.dischargedPatients / stats.totalPatients) * 100 : 0;
  const criticalLoad = stats.admittedPatients > 0 ? (stats.emergencyAdmitted / stats.admittedPatients) * 100 : 0;

  return {
    ...stats,
    bedOccupancyRate: Math.round(bedOccupancyRate),
    doctorUtilizationRate: Math.round(doctorUtilizationRate),
    treatmentEfficiency: Math.round(treatmentEfficiency),
    criticalLoad: Math.round(criticalLoad)
  };
}

function getSystemHealthChecks(stats) {
  return [
    {
      name: "Emergency Department Status",
      status: stats.criticalLoad > 20 ? "High capacity warning" : "Operating normally",
      description: stats.criticalLoad > 20
        ? "Routing new emergencies may be delayed."
        : "Capable of handling new traumas."
    },
    {
      name: "Staffing Levels",
      status: stats.doctorUtilizationRate > 85 ? "Staffing strain" : "Adequate staffing",
      description: stats.doctorUtilizationRate > 85
        ? "Medical staff are severely strained. Consider calling on-call physicians."
        : "Adequate physician availability for current patient volume."
    },
    {
      name: "Bed Availability",
      status: stats.bedOccupancyRate > 90 ? "Critical bed shortage" : "Normal availability",
      description: stats.bedOccupancyRate > 90
        ? "Expedite discharges if clinically appropriate."
        : "Normal bed availability across all wards."
    }
  ];
}

app.get("/api/efficiency", verifyToken, async (req, res) => {
  try {
    const stats = await getEfficiencyStats();
    res.json({
      ...stats
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

app.get("/api/reports/efficiency/pdf", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const stats = await getEfficiencyStats();
    const generatedAt = new Date();
    const fileDate = generatedAt.toISOString().replace(/[:.]/g, "-").slice(0, 16);
    const document = new PDFDocument({ margin: 50, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=efficiency-report-${fileDate}.pdf`);
    document.pipe(res);

    const sectionTitle = (title) => {
      document.moveDown(1).fontSize(16).fillColor("#0f4c81").text(title).moveDown(0.4);
    };
    const metric = (name, value, percentage, detail) => {
      document.fontSize(11).fillColor("#1f2937").text(name, { continued: true });
      document.font("Helvetica-Bold").text(`  ${value} (${percentage}%)`);
      document.font("Helvetica").fontSize(9).fillColor("#6b7280").text(detail).moveDown(0.5);
    };

    document.fontSize(22).fillColor("#0f4c81").text(process.env.HOSPITAL_NAME || "Smart Hospital");
    document.fontSize(16).fillColor("#111827").text("Hospital Efficiency Analytics Report");
    document.fontSize(9).fillColor("#6b7280").text(`Generated: ${generatedAt.toLocaleString()}`);
    document.moveDown().moveTo(50, document.y).lineTo(545, document.y).strokeColor("#d1d5db").stroke();

    sectionTitle("Key Metrics");
    metric("Bed Occupancy", `${stats.occupiedRooms}/${stats.totalRooms}`, stats.bedOccupancyRate, "Active beds currently in use");
    metric("Doctor Utilization", `${stats.busyDoctors}/${stats.totalDoctors}`, stats.doctorUtilizationRate, "Doctors currently busy");
    metric("Treatment Efficiency", `${stats.dischargedPatients} discharged`, stats.treatmentEfficiency, `Out of ${stats.totalPatients} historically`);

    sectionTitle("Utilization Deep Dive");
    metric("Inpatient Ward Capacity", `${stats.occupiedRooms}/${stats.totalRooms}`, stats.bedOccupancyRate, "Occupied rooms out of total rooms");
    metric("Medical Staff Bandwidth", `${stats.busyDoctors}/${stats.totalDoctors}`, stats.doctorUtilizationRate, "Busy doctors out of total doctors");
    metric("Critical Care Load", `${stats.emergencyAdmitted}/${stats.admittedPatients}`, stats.criticalLoad, "Critical emergency patients out of admitted patients");

    sectionTitle("System Health Checks");
    getSystemHealthChecks(stats).forEach((check) => {
      document.fontSize(11).fillColor("#1f2937").text(`${check.name}: ${check.status}`);
      document.fontSize(9).fillColor("#6b7280").text(check.description).moveDown(0.6);
    });

    document.end();
  } catch (err) {
    console.error("Efficiency PDF report error:", err);
    if (!res.headersSent) {
      res.status(500).json({ message: "Unable to generate the efficiency PDF report." });
    } else {
      res.end();
    }
  }
});

// =====================================================
// APPOINTMENTS (separate from patient admission)
// =====================================================
const serverToday = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const isValidDateOnly = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
};

app.post("/appointments", verifyToken, requireRole("admin", "receptionist"), async (req, res) => {
  try {
    const { patient_name, patient_phone, doctor_id, appointment_date, appointment_time, reason } = req.body;
    const parsedDoctorId = Number(doctor_id);
    const normalizedPhone = patient_phone?.trim() || null;

    if (!patient_name?.trim() || !appointment_date || !appointment_time?.trim() || !Number.isInteger(parsedDoctorId) || parsedDoctorId <= 0) {
      return res.status(400).json({ message: "Patient name, doctor, date, and time are required." });
    }

    // Date-only appointment values must be compared in the server's calendar,
    // not converted to UTC where a timezone offset could shift the day.
    if (!isValidDateOnly(appointment_date)) {
      return res.status(400).json({
        error: "Appointment date must be a valid date.",
        message: "Appointment date must be a valid date."
      });
    }

    if (appointment_date < serverToday()) {
      return res.status(400).json({
        error: "Appointment date cannot be in the past",
        message: "Appointment date cannot be in the past"
      });
    }

    if (normalizedPhone && !/^\d{10}$/.test(normalizedPhone)) {
      return res.status(400).json({ message: "Phone number must be 10 digits." });
    }

    // Do not allow a stale form submission to assign work to a deactivated doctor.
    const [activeDoctor] = await db.execute(
      `SELECT d.doctor_id FROM doctors d
       LEFT JOIN users u ON u.user_id = d.user_id
       WHERE d.doctor_id = $1 AND (d.user_id IS NULL OR u.is_active = TRUE)`,
      [parsedDoctorId]
    );
    if (!activeDoctor.length) {
      return res.status(409).json({ message: "That doctor is no longer active. Choose another doctor." });
    }

    const [appointment] = await db.execute(
      `INSERT INTO appointments
        (patient_name, patient_phone, doctor_id, appointment_date, appointment_time, reason)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING appointment_id, patient_name, patient_phone, doctor_id, appointment_date, appointment_time, reason, status, created_at`,
      [
        patient_name.trim(),
        normalizedPhone,
        parsedDoctorId,
        appointment_date,
        appointment_time.trim(),
        reason?.trim() || null
      ]
    );

    res.status(201).json(appointment[0]);
  } catch (err) {
    console.error("Create appointment error:", err);
    res.status(500).json({ message: "Unable to create appointment." });
  }
});

app.get("/appointments", verifyToken, async (req, res) => {
  try {
    const clauses = [];
    const params = [];

    if (req.query.doctor_id !== undefined) {
      const doctorId = Number(req.query.doctor_id);
      if (!Number.isInteger(doctorId) || doctorId <= 0) {
        return res.status(400).json({ message: "doctor_id must be a positive integer." });
      }
      params.push(doctorId);
      clauses.push(`a.doctor_id = $${params.length}`);
    }

    if (req.query.date !== undefined) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(req.query.date)) {
        return res.status(400).json({ message: "date must use YYYY-MM-DD format." });
      }
      params.push(req.query.date);
      clauses.push(`a.appointment_date = $${params.length}`);
    }

    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const [appointments] = await db.execute(
      `SELECT a.appointment_id, a.patient_name, a.patient_phone, a.doctor_id,
              TO_CHAR(a.appointment_date, 'YYYY-MM-DD') AS appointment_date,
              a.appointment_time, a.reason, a.status,
              a.created_at, d.name AS doctor_name
       FROM appointments a
       LEFT JOIN doctors d ON d.doctor_id = a.doctor_id
       ${where}
       ORDER BY a.appointment_date ASC, a.appointment_time ASC, a.appointment_id DESC`,
      params
    );

    res.json(appointments);
  } catch (err) {
    console.error("List appointments error:", err);
    res.status(500).json({ message: "Unable to load appointments." });
  }
});

app.put("/appointments/:appointment_id", verifyToken, requireRole("admin", "doctor"), async (req, res) => {
  try {
    const appointmentId = Number(req.params.appointment_id);
    const allowedStatuses = new Set(["Scheduled", "Completed", "Cancelled", "No-show"]);
    const { status } = req.body;

    if (!Number.isInteger(appointmentId) || appointmentId <= 0 || !allowedStatuses.has(status)) {
      return res.status(400).json({ message: "Provide a valid appointment ID and status." });
    }

    const [updated] = await db.execute(
      `UPDATE appointments SET status = $1
       WHERE appointment_id = $2
       RETURNING appointment_id, status`,
      [status, appointmentId]
    );

    if (!updated.length) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    res.json(updated[0]);
  } catch (err) {
    console.error("Update appointment error:", err);
    res.status(500).json({ message: "Unable to update appointment." });
  }
});

app.delete("/appointments/:appointment_id", verifyToken, requireRole("admin", "receptionist"), async (req, res) => {
  try {
    const appointmentId = Number(req.params.appointment_id);
    if (!Number.isInteger(appointmentId) || appointmentId <= 0) {
      return res.status(400).json({ message: "Provide a valid appointment ID." });
    }

    const [deleted] = await db.execute(
      "DELETE FROM appointments WHERE appointment_id = $1 RETURNING appointment_id",
      [appointmentId]
    );

    if (!deleted.length) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    res.json({ message: "Appointment removed." });
  } catch (err) {
    console.error("Delete appointment error:", err);
    res.status(500).json({ message: "Unable to remove appointment." });
  }
});

// =====================================================
// ACCOUNT MANAGEMENT (soft delete)
// =====================================================
async function getDeactivationWarnings(userId) {
  const [doctorRows] = await db.execute(
    "SELECT doctor_id FROM doctors WHERE user_id = $1",
    [userId]
  );
  if (!doctorRows.length) return { upcomingAppointments: 0, admittedPatients: 0 };

  const doctorId = doctorRows[0].doctor_id;
  const [[appointmentCount]] = await db.execute(
    "SELECT COUNT(*) AS count FROM appointments WHERE doctor_id = $1 AND appointment_date >= CURRENT_DATE AND status = 'Scheduled'",
    [doctorId]
  );
  const [[patientCount]] = await db.execute(
    "SELECT COUNT(*) AS count FROM patients WHERE doctor_id = $1 AND LOWER(status) = 'admitted'",
    [doctorId]
  );
  return {
    upcomingAppointments: Number(appointmentCount.count) || 0,
    admittedPatients: Number(patientCount.count) || 0
  };
}

async function deactivateAccount(req, res, targetUserId) {
  const [users] = await db.execute(
    "SELECT user_id, name, role, is_active, auth_user_id FROM users WHERE user_id = $1",
    [targetUserId]
  );
  const target = users[0];
  if (!target) return res.status(404).json({ message: "User not found." });
  if (!target.is_active) return res.status(400).json({ message: "This account is already deactivated." });

  const confirmation = String(req.body.confirmation || "").trim();
  if (confirmation !== "DELETE" && confirmation.toLowerCase() !== target.name.toLowerCase()) {
    return res.status(400).json({ message: 'Type "DELETE" or the account name to confirm.' });
  }

  if (target.role === "admin") {
    const [[adminCount]] = await db.execute(
      "SELECT COUNT(*) AS count FROM users WHERE role = 'admin' AND is_active = TRUE"
    );
    if (Number(adminCount.count) <= 1) {
      return res.status(409).json({ message: "The only active Admin account cannot be deactivated." });
    }
  }

  const warnings = target.role === "doctor" ? await getDeactivationWarnings(target.user_id) : {};
  if ((warnings.upcomingAppointments || warnings.admittedPatients) && req.body.override !== true) {
    return res.status(409).json({
      message: "This doctor still has assigned work. Reassign it or confirm the override.",
      requiresOverride: true,
      warnings
    });
  }

  // Auth users are managed only from this server.  A service-role key is never
  // sent to the browser.  Existing password-based installations simply leave
  // auth_user_id NULL; their login is blocked by is_active above.
  if (target.auth_user_id) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(503).json({ message: "Supabase Auth is not configured; account was not deactivated." });
    }
    const authResponse = await fetch(
      `${supabaseUrl.replace(/\/$/, "")}/auth/v1/admin/users/${target.auth_user_id}`,
      {
        method: "PUT",
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json"
        },
        // Supabase bans the Auth account; the application record remains for history.
        body: JSON.stringify({ ban_duration: "876000h" })
      }
    );
    if (!authResponse.ok) {
      console.error("Supabase Auth disable failed:", await authResponse.text());
      return res.status(502).json({ message: "Could not disable the linked Auth account; account was not deactivated." });
    }
  }

  await db.execute(
    "UPDATE users SET is_active = FALSE, deleted_at = NOW() WHERE user_id = $1",
    [target.user_id]
  );
  res.json({ message: "Account deactivated.", warnings });
}

app.get("/users", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const [users] = await db.execute(
      "SELECT user_id, name, email, role, is_active, deleted_at, created_at FROM users ORDER BY is_active DESC, created_at DESC"
    );
    res.json(users);
  } catch (err) {
    console.error("List users error:", err);
    res.status(500).json({ message: "Unable to load users." });
  }
});

app.get("/users/me/deactivation-status", verifyToken, async (req, res) => {
  try {
    const [users] = await db.execute(
      "SELECT role FROM users WHERE user_id = $1 AND is_active = TRUE",
      [req.user.id]
    );

    if (!users.length) {
      return res.status(404).json({ message: "Active user account not found." });
    }

    const isAdmin = users[0].role.toLowerCase() === "admin";
    let isOnlyActiveAdmin = false;

    if (isAdmin) {
      const [admins] = await db.execute(
        "SELECT COUNT(*) AS count FROM users WHERE role = 'admin' AND is_active = TRUE"
      );
      isOnlyActiveAdmin = Number(admins[0].count) <= 1;
    }

    res.json({ canDeactivate: !isOnlyActiveAdmin, isOnlyActiveAdmin });
  } catch (err) {
    console.error("Deactivation status error:", err);
    res.status(500).json({ message: "Unable to check account deactivation status." });
  }
});

app.delete("/users/me", verifyToken, async (req, res) => {
  try {
    await deactivateAccount(req, res, req.user.id);
  } catch (err) {
    console.error("Self-deactivation error:", err);
    res.status(500).json({ message: "Unable to deactivate account." });
  }
});

app.delete("/users/:user_id", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const userId = Number(req.params.user_id);
    if (!Number.isInteger(userId) || userId <= 0) return res.status(400).json({ message: "Invalid user ID." });
    await deactivateAccount(req, res, userId);
  } catch (err) {
    console.error("Admin deactivation error:", err);
    res.status(500).json({ message: "Unable to deactivate account." });
  }
});


// =====================================================
// DATA ROUTES
// =====================================================

app.get("/patients", verifyToken, async (req, res) => {
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

app.get("/doctors", verifyToken, async (req, res) => {
  try {
    const [result] = await db.execute(`
      SELECT 
        d.doctor_id,
        d.name,
        d.specialization,
        d.status,
        d.phone,
        d.email
      FROM doctors d
      -- user_id was added after the original doctors table existed. Using
      -- to_jsonb keeps this read endpoint compatible until migration 002 has
      -- been run, while still hiding a doctor linked to an inactive user.
      LEFT JOIN users u ON u.user_id::text = (to_jsonb(d) ->> 'user_id')
      WHERE (to_jsonb(d) ->> 'user_id') IS NULL OR u.is_active = TRUE
      ORDER BY d.doctor_id ASC
    `);

    res.json(result);

  } catch (err) {
    console.error("Error fetching doctors:", {
      message: err.message,
      code: err.code,
      detail: err.detail,
      hint: err.hint
    });

    res.status(500).json({
      success: false,
      message: "Failed to fetch doctors",
      error: err.message
    });
  }
});

app.get("/rooms", verifyToken, async (req, res) => {
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
