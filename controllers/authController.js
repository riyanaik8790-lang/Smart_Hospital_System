const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const SECRET_KEY = "hospital_secret_key";

exports.login = (req, res) => {

  const { email, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE email=?",
    [email],
    async (err, result) => {

      if (result.length === 0)
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
        role: user.role
      });

    }
  );

};