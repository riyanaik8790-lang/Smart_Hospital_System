const jwt = require("jsonwebtoken");
const db = require("../db");

const SECRET_KEY = process.env.JWT_SECRET || "hospital_secret_key";

async function verifyToken(req, res, next) {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication token is required." });
  }

  const token = authorization.slice(7).trim();

  try {
    req.user = jwt.verify(token, SECRET_KEY);
  } catch {
    return res.status(401).json({ message: "Invalid or expired authentication token." });
  }

  try {
    const [users] = await db.execute(
      "SELECT is_active, role, must_change_password FROM users WHERE user_id = $1",
      [req.user.id]
    );
    if (!users.length || !users[0].is_active) {
      return res.status(401).json({ message: "This account has been deactivated." });
    }
    // Authorization must follow the current database role, not a stale JWT
    // claim left over after an Admin changes someone's role.
    req.user.role = users[0].role;
    req.user.mustChangePassword = Boolean(users[0].must_change_password);

    // A temporary-password session is restricted to this endpoint until the
    // staff member sets a private password. This is server-side, so changing
    // the browser route or local storage cannot bypass it.
    if (req.user.mustChangePassword && !(req.method === "POST" && req.path === "/api/auth/change-password")) {
      return res.status(403).json({ message: "A new password is required before accessing the system.", code: "PASSWORD_CHANGE_REQUIRED" });
    }
    next();
  } catch (err) {
    console.error("Authenticated user lookup failed:", err);
    return res.status(500).json({ message: "Unable to verify the active account." });
  }
}

module.exports = verifyToken;
