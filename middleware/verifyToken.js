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
    const [users] = await db.execute(
      "SELECT is_active FROM users WHERE user_id = $1",
      [req.user.id]
    );
    if (!users.length || !users[0].is_active) {
      return res.status(401).json({ message: "This account has been deactivated." });
    }
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired authentication token." });
  }
}

module.exports = verifyToken;
