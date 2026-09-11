require("dotenv").config();
const db = require("./db");

db.execute(
  "ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS user_id BIGINT UNIQUE REFERENCES public.users(user_id)"
)
  .then(() => console.log("Doctors table migration applied."))
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
