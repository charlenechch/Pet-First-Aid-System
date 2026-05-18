const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const pool = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// ==========================
// REGISTER API
// ==========================
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, phone_no, password } = req.body;

    // validation
    if (!name || !email || !phone_no || !password) {
      return res.status(400).json({
        message: "Please fill in all required fields.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters.",
      });
    }

    // check email already exists
    const [existingUsers] = await pool.query(
      "SELECT userID FROM users WHERE email = ?",
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        message: "Email already registered.",
      });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // insert new user
    const [result] = await pool.query(
      `INSERT INTO users 
       (name, email, phone_no, password, role, status)
       VALUES (?, ?, ?, ?, 'pet_owner', 'Active')`,
      [name, email, phone_no, hashedPassword]
    );

    res.status(201).json({
      message: "Account registered successfully.",
      user: {
        userID: result.insertId,
        name,
        email,
        phone_no,
        role: "pet_owner",
        status: "Active",
      },
    });
  } catch (error) {
    console.error("Register error:", error);

    res.status(500).json({
      message: "Server error during registration.",
      error: error.message,
    });
  }
});

// ==========================
// LOGIN API
// ==========================
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // validation
    if (!email || !password) {
      return res.status(400).json({
        message: "Please enter email and password.",
      });
    }

    // find active user
    const [users] = await pool.query(
      "SELECT * FROM users WHERE email = ? AND status = 'Active'",
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const user = users[0];

    // compare password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    // update last login
    await pool.query(
      "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE userID = ?",
      [user.userID]
    );

    // create token
    const token = jwt.sign(
      {
        userID: user.userID,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET || "default_secret",
      {
        expiresIn: "1d",
      }
    );

    res.json({
      message: "Login successful.",
      token,
      user: {
        userID: user.userID,
        name: user.name,
        email: user.email,
        phone_no: user.phone_no,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      message: "Server error during login.",
      error: error.message,
    });
  }
});

app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;

    if (!email || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: "Please fill in all required fields.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "New password and confirm password do not match.",
      });
    }

    const [users] = await pool.query(
      "SELECT userID FROM users WHERE email = ? AND status = 'Active'",
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({
        message: "No active account found with this email.",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query("UPDATE users SET password = ? WHERE email = ?", [
      hashedPassword,
      email,
    ]);

    res.json({
      message:
        "Password reset successfully. You can now login with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);

    res.status(500).json({
      message: "Server error during password reset.",
      error: error.message,
    });
  }
});

// ==========================
// START SERVER
// ==========================
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});