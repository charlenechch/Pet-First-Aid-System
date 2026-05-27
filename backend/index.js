const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const pool = require("./db");
const adminRoutes = require("./routes/admin");
const petownerRoutes = require("./routes/petowner");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// REGISTER API
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

// LOGIN API
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Please enter email and password.",
      });
    }

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

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    await pool.query(
      "UPDATE users SET last_login = UTC_TIMESTAMP() WHERE userID = ?",
      [user.userID]
    );

    const [checkTime] = await pool.query(
      "SELECT last_login, UTC_TIMESTAMP() AS utc_now, NOW() AS mysql_now FROM users WHERE userID = ?",
      [user.userID]
    );

    console.log("LOGIN TIME CHECK:", checkTime[0]);

    const [updatedUsers] = await pool.query(
      "SELECT userID, name, email, phone_no, role, status, bio, last_login, created_at FROM users WHERE userID = ?",
      [user.userID]
    );

    const updatedUser = updatedUsers[0];

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

// RESET PASSWORD API
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

// ADMIN ROUTES
app.use("/api/admin", adminRoutes);

// PET OWNER ROUTES
app.use("/api", petownerRoutes);

// GET EMERGENCY TOPICS
// Search + filter by pet type/severity
app.get("/api/emergency-topics", async (req, res) => {
  try {
    const { keyword = "", pet = "", severity = "" } = req.query;

    let sql = `
      SELECT 
        e.emergencyID,
        e.topicTitle,
        e.topicDesc,
        e.severity,
        e.keywords,
        e.status,
        p.petID,
        p.petName,
        p.icon
      FROM emergency_cases e
      JOIN pets p ON e.petID = p.petID
      WHERE e.status = 'Published'
    `;

    const params = [];

    if (keyword.trim() !== "") {
      sql += `
        AND (
          e.topicTitle LIKE ?
          OR e.topicDesc LIKE ?
          OR e.keywords LIKE ?
        )
      `;
      const searchValue = `%${keyword}%`;
      params.push(searchValue, searchValue, searchValue);
    }

    if (pet.trim() !== "" && pet !== "All Pets") {
      sql += ` AND p.petName = ?`;
      params.push(pet);
    }

    if (severity.trim() !== "" && severity !== "All Severity") {
      sql += ` AND e.severity = ?`;
      params.push(severity);
    }

    sql += ` ORDER BY e.created_at DESC`;

    const [topics] = await pool.query(sql, params);

    res.json({
      message: "Emergency topics loaded successfully.",
      topics,
    });
  } catch (error) {
    console.error("Get emergency topics error:", error);
    res.status(500).json({
      message: "Server error while loading emergency topics.",
      error: error.message,
    });
  }
});

// GET ONE EMERGENCY TOPIC DETAILS + GUIDE + MEDIA
app.get("/api/emergency-topics/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [topics] = await pool.query(
      `
      SELECT
        e.emergencyID,
        e.topicTitle,
        e.topicDesc,
        e.severity,
        e.keywords,
        e.status,

        p.petID,
        p.petName,
        p.icon,

        g.guideID,
        g.guideTitle,
        g.overview,
        g.steps,
        g.status AS guideStatus,

        va.advice_text
      FROM emergency_cases e
      JOIN pets p ON e.petID = p.petID
      LEFT JOIN first_aid_guides g 
        ON e.emergencyID = g.emergencyID
      LEFT JOIN veterinary_advice va
        ON g.guideID = va.guideID
        AND LOWER(va.adviceStatus) = 'published'
      WHERE e.emergencyID = ?
        AND e.status = 'Published'
      LIMIT 1
      `,
      [id]
    );

    if (topics.length === 0) {
      return res.status(404).json({
        message: "Emergency topic not found.",
      });
    }

    const topic = topics[0];

    let media = [];

    if (topic.guideID) {
      const [mediaRows] = await pool.query(
        `
        SELECT
          mediaID,
          guideID,
          media_type,
          mediaTitle,
          caption,
          mediaURL,
          mediaStatus
        FROM media
        WHERE guideID = ?
          AND LOWER(mediaStatus) = 'published'
        ORDER BY mediaID DESC
        `,
        [topic.guideID]
      );

      media = mediaRows;
    }

    res.json({
      message: "Emergency topic loaded successfully.",
      topic: {
        ...topic,
        media,
      },
    });
  } catch (error) {
    console.error("Get emergency topic details error:", error);

    res.status(500).json({
      message: "Server error while loading emergency topic.",
      error: error.message,
    });
  }
});

// ==========================
// PUBLIC FEEDBACK
// Uses same feedback table as pet owner feedback
// If email matches registered user, link to that userID
// ==========================
app.post("/api/public/feedback", async (req, res) => {
  try {
    const { name, email, category, emergencyID, rating, message } = req.body;

    if (!name || !email || !category || !emergencyID || !rating || !message) {
      return res.status(400).json({
        message: "Name, email, guide, rating, and message are required.",
      });
    }

    if (Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5.",
      });
    }

    if (message.trim().length < 10) {
      return res.status(400).json({
        message: "Feedback message must be at least 10 characters.",
      });
    }

    // Check selected guide exists
    const [topicRows] = await pool.query(
      `
      SELECT emergencyID, topicTitle
      FROM emergency_cases
      WHERE emergencyID = ?
      LIMIT 1
      `,
      [emergencyID]
    );

    if (topicRows.length === 0) {
      return res.status(404).json({
        message: "Selected guide does not exist.",
      });
    }

    // Check whether email belongs to registered user
    const [users] = await pool.query(
      `
      SELECT userID
      FROM users
      WHERE LOWER(email) = LOWER(?)
      LIMIT 1
      `,
      [email.trim()]
    );

    const linkedUserID = users.length > 0 ? users[0].userID : null;

    const [result] = await pool.query(
      `
      INSERT INTO feedback
      (
        userID,
        emergencyID,
        name,
        email,
        category,
        rating,
        message,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        linkedUserID,
        Number(emergencyID),
        name.trim(),
        email.trim(),
        category.trim(),
        Number(rating),
        message.trim(),
        "new",
      ]
    );

    res.json({
      message: linkedUserID
        ? "Feedback submitted and linked to your account."
        : "Feedback submitted successfully.",
      linkedToAccount: Boolean(linkedUserID),
      feedbackID: result.insertId,
    });
  } catch (error) {
    console.error("Public feedback error:", error);

    res.status(500).json({
      message: "Server error while submitting feedback.",
      error: error.message,
    });
  }
});

// PUBLIC STATS
app.get("/api/stats", async (req, res) => {
  try {
    const [[guides]] = await pool.query(
      "SELECT COUNT(*) AS count FROM first_aid_guides WHERE status = 'Published'"
    );
    const [[pets]] = await pool.query(
      "SELECT COUNT(*) AS count FROM pets WHERE status = 'Active'"
    );
    const [[users]] = await pool.query(
      "SELECT COUNT(*) AS count FROM users WHERE role = 'pet_owner' AND status = 'Active'"
    );
    const [[feedback]] = await pool.query(
      "SELECT COUNT(*) AS count FROM feedback"
    );
    const [[posRating]] = await pool.query(
      "SELECT COUNT(*) AS count FROM feedback WHERE rating >= 4"
    );

    const positivePct =
      feedback.count === 0
        ? 100
        : Math.round((posRating.count / feedback.count) * 100);

    res.json({
      guides: guides.count,
      species: pets.count,
      users: users.count,
      positiveFeedbackPct: positivePct,
    });
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({ message: "Server error loading stats." });
  }
});

// START SERVER
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
