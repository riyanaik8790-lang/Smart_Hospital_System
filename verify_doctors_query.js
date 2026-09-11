require("dotenv").config();
const db = require("./db");

Promise.all([
  db.execute(`
    SELECT d.doctor_id, d.name, d.specialization, d.status, d.phone, d.email
    FROM doctors d
    LEFT JOIN users u ON u.user_id = d.user_id
    WHERE d.user_id IS NULL OR u.is_active = TRUE
    ORDER BY doctor_id ASC
  `),
  db.execute("SELECT policyname, cmd FROM pg_policies WHERE schemaname = 'public' AND tablename = 'doctors'")
])
  .then(([[doctors], [policies]]) => {
    console.log(JSON.stringify({ doctorCount: doctors.length, policies }));
    process.exit(0);
  })
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
