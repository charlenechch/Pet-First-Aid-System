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

    const [existingUsers] = await pool.query(
      "SELECT userID FROM users WHERE email = ?",
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        message: "Email already registered.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `INSERT INTO users 
       (name, email, phone_no, password, role, status)
       VALUES (?, ?, ?, ?, 'pet_owner', 'Active')`,
      [name, email, phone_no, hashedPassword]
    );

    // Get the newly created user including created_at
    const [newUsers] = await pool.query(
      `SELECT userID, name, email, phone_no, role, status, bio, last_login, created_at
       FROM users
       WHERE userID = ?`,
      [result.insertId]
    );

    const newUser = newUsers[0];

    res.status(201).json({
      message: "Account registered successfully.",
      user: newUser,
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

    // update last login time after successful login
await pool.query(
  "UPDATE users SET last_login = UTC_TIMESTAMP() WHERE userID = ?",
  [user.userID]
);

await pool.query(
  "UPDATE users SET last_login = UTC_TIMESTAMP() WHERE userID = ?",
  [user.userID]
);

const [checkTime] = await pool.query(
  "SELECT last_login, UTC_TIMESTAMP() AS utc_now, NOW() AS mysql_now FROM users WHERE userID = ?",
  [user.userID]
);

console.log("LOGIN TIME CHECK:", checkTime[0]);

 // get updated user after last_login update
    const [updatedUsers] = await pool.query(
      "SELECT userID, name, email, phone_no, role, status, bio, last_login, created_at FROM users WHERE userID = ?",
      [user.userID]
    );

    const updatedUser = updatedUsers[0];

    // create token
    const token = jwt.sign(
      {
        userID: updatedUser.userID,
        email: updatedUser.email,
        role: updatedUser.role,
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
        userID: updatedUser.userID,
        name: updatedUser.name,
        email: updatedUser.email,
        phone_no: updatedUser.phone_no,
        role: updatedUser.role,
        status: updatedUser.status,
        bio: updatedUser.bio,
        last_login: updatedUser.last_login,
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
// AUTH MIDDLEWARE
// ==========================
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Access denied. No token provided.",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "default_secret"
    );

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token.",
    });
  }
}

// ==========================
// GET CURRENT USER PROFILE
// ==========================
app.get("/api/profile/me", verifyToken, async (req, res) => {
  try {
    const [users] = await pool.query(
      `SELECT 
        userID, name, email, phone_no, role, status, bio, last_login, created_at
       FROM users
       WHERE userID = ?`,
      [req.user.userID]
    );

    if (users.length === 0) {
      return res.status(404).json({
        message: "User profile not found.",
      });
    }

    res.json({
      message: "Profile loaded successfully.",
      user: users[0],
    });
  } catch (error) {
    console.error("Get profile error:", error);

    res.status(500).json({
      message: "Server error while loading profile.",
      error: error.message,
    });
  }
});

// ==========================
// UPDATE CURRENT USER PROFILE
// ==========================
app.put("/api/profile/me", verifyToken, async (req, res) => {
  try {
    const { name, email, phone_no, bio } = req.body;

    if (!name || !email || !phone_no) {
      return res.status(400).json({
        message: "Name, email and phone number are required.",
      });
    }

    // Check whether the new email is already used by another user
    const [existingUsers] = await pool.query(
      "SELECT userID FROM users WHERE email = ? AND userID != ?",
      [email, req.user.userID]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        message: "This email is already used by another account.",
      });
    }

    await pool.query(
      `UPDATE users
       SET name = ?, email = ?, phone_no = ?, bio = ?
       WHERE userID = ?`,
      [name, email, phone_no, bio || null, req.user.userID]
    );

    const [updatedUsers] = await pool.query(
      `SELECT 
        userID, name, email, phone_no, role, status, bio, last_login, created_at
       FROM users
       WHERE userID = ?`,
      [req.user.userID]
    );

    res.json({
      message: "Profile updated successfully.",
      user: updatedUsers[0],
    });
  } catch (error) {
    console.error("Update profile error:", error);

    res.status(500).json({
      message: "Server error while updating profile.",
      error: error.message,
    });
  }
});

// ==========================
// CHANGE PASSWORD FROM PROFILE PAGE
// ==========================
app.put("/api/profile/change-password", verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: "Please fill in all password fields.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "New password and confirmation do not match.",
      });
    }

    const [users] = await pool.query(
      "SELECT userID, password FROM users WHERE userID = ?",
      [req.user.userID]
    );

    if (users.length === 0) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    const user = users[0];

    const isCurrentPasswordCorrect = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isCurrentPasswordCorrect) {
      return res.status(401).json({
        message: "Current password is incorrect.",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query("UPDATE users SET password = ? WHERE userID = ?", [
      hashedPassword,
      req.user.userID,
    ]);

    res.json({
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error("Change password error:", error);

    res.status(500).json({
      message: "Server error while changing password.",
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