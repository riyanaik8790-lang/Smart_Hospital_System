const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.JWT_SECRET || "hospital_secret_key";

function verifyToken(req, res, next) {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication token is required." });
  }

  const token = authorization.slice(7).trim();

  try {
    req.user = jwt.verify(token, SECRET_KEY);
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired authentication token." });
  }
}

module.exports = verifyToken;
