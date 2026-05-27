const express = require("express");
const jwt = require("jsonwebtoken");
const pool = require("../db");

const router = express.Router();

// AUTH GUARDS
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret");
    req.user = decoded; // { userID, email, role }
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}

function verifyAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admin privileges required." });
  }
  next();
}

// Apply both guards to EVERY route in this router in one line.
router.use(verifyToken, verifyAdmin);

// DASHBOARD SUMMARY  ->  GET /api/admin/dashboard
async function safeCount(sql) {
  try {
    const [rows] = await pool.query(sql);
    return rows[0].count;
  } catch (error) {
    console.error("Dashboard count skipped:", error.message);
    return 0;
  }
}

router.get("/dashboard", async (req, res) => {
  try {
    const stats = {
      users:    await safeCount("SELECT COUNT(*) AS count FROM users WHERE role = 'pet_owner'"),
      guides:   await safeCount("SELECT COUNT(*) AS count FROM first_aid_guides WHERE status = 'Published'"),
      quizzes:  await safeCount("SELECT COUNT(*) AS count FROM quizzes WHERE quizStatus = 'published'"),
      feedback: await safeCount("SELECT COUNT(*) AS count FROM feedback"),
    };

    // Recent registrations (users table definitely exists)
    let recentRegistrations = [];
    try {
      const [rows] = await pool.query(
        `SELECT name, status, created_at
         FROM users
         WHERE role = 'pet_owner'
         ORDER BY created_at DESC
         LIMIT 5`
      );
      recentRegistrations = rows;
    } catch (error) {
      console.error("Recent registrations skipped:", error.message);
    }

    // Recent feedback (table may not exist yet)
    let recentFeedback = [];
    try {
      const [rows] = await pool.query(
        `SELECT f.rating, f.message, u.name AS userName, f.submitted_at
         FROM feedback f
         JOIN users u ON f.userID = u.userID
         ORDER BY f.submitted_at DESC
         LIMIT 5`
      );
      recentFeedback = rows;
    } catch (error) {
      console.error("Recent feedback skipped:", error.message);
    }

    res.json({ message: "Dashboard loaded.", stats, recentRegistrations, recentFeedback });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    res.status(500).json({ message: "Server error loading dashboard.", error: error.message });
  }
});


// USER MANAGEMENT
// GET /api/admin/users  — list all users (never returns password)
router.get("/users", async (req, res) => {
  try {
    const [users] = await pool.query(
      `SELECT userID, name, email, phone_no, role, status, last_login, created_at
       FROM users
       ORDER BY created_at DESC`
    );
    res.json({ message: "Users loaded.", users });
  } catch (error) {
    console.error("Admin get users error:", error);
    res.status(500).json({ message: "Server error loading users.", error: error.message });
  }
});

// GET /api/admin/users/:id  — single user
router.get("/users/:id", async (req, res) => {
  try {
    const [users] = await pool.query(
      `SELECT userID, name, email, phone_no, role, status, bio, last_login, created_at
       FROM users
       WHERE userID = ?`,
      [req.params.id]
    );
    if (users.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }
    res.json({ message: "User loaded.", user: users[0] });
  } catch (error) {
    console.error("Admin get user error:", error);
    res.status(500).json({ message: "Server error loading user.", error: error.message });
  }
});

// PATCH /api/admin/users/:id/status  — enable / disable a user
// Body: { "status": "Active" | "Inactive" }
router.patch("/users/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    if (!["Active", "Inactive"].includes(status)) {
      return res.status(400).json({ message: "Status must be 'Active' or 'Inactive'." });
    }

    // Stop an admin from disabling their own account by accident
    if (Number(req.params.id) === req.user.userID && status === "Inactive") {
      return res.status(400).json({ message: "You cannot deactivate your own account." });
    }

    const [result] = await pool.query(
      "UPDATE users SET status = ? WHERE userID = ?",
      [status, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json({ message: `User ${status === "Active" ? "activated" : "deactivated"}.` });
  } catch (error) {
    console.error("Admin update user status error:", error);
    res.status(500).json({ message: "Server error updating user.", error: error.message });
  }
});


// PET CATEGORIES  (Dog, Cat, Rabbit, ...)
router.get("/pets", async (req, res) => {
  try {
    const [pets] = await pool.query(
      "SELECT petID, petName, icon, petDesc, status, created_at FROM pets ORDER BY created_at DESC"
    );
    res.json({ message: "Pets loaded.", pets });
  } catch (error) {
    console.error("Admin get pets error:", error);
    res.status(500).json({ message: "Server error loading pets.", error: error.message });
  }
});

router.post("/pets", async (req, res) => {
  try {
    const { petName, icon, petDesc, status } = req.body;
    if (!petName) {
      return res.status(400).json({ message: "Pet name is required." });
    }
    const [result] = await pool.query(
      "INSERT INTO pets (petName, icon, petDesc, status) VALUES (?, ?, ?, ?)",
      [petName, icon || null, petDesc || null, status || "Active"]
    );
    res.status(201).json({ message: "Pet created.", petID: result.insertId });
  } catch (error) {
    console.error("Admin create pet error:", error);
    res.status(500).json({ message: "Server error creating pet.", error: error.message });
  }
});

router.put("/pets/:id", async (req, res) => {
  try {
    const { petName, icon, petDesc, status } = req.body;
    if (!petName) {
      return res.status(400).json({ message: "Pet name is required." });
    }
    const [result] = await pool.query(
      "UPDATE pets SET petName = ?, icon = ?, petDesc = ?, status = ? WHERE petID = ?",
      [petName, icon || null, petDesc || null, status || "Active", req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Pet not found." });
    }
    res.json({ message: "Pet updated." });
  } catch (error) {
    console.error("Admin update pet error:", error);
    res.status(500).json({ message: "Server error updating pet.", error: error.message });
  }
});

router.delete("/pets/:id", async (req, res) => {
  try {
    const [result] = await pool.query("DELETE FROM pets WHERE petID = ?", [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Pet not found." });
    }
    res.json({ message: "Pet deleted." });
  } catch (error) {
    console.error("Admin delete pet error:", error);
    res.status(500).json({ message: "Server error deleting pet.", error: error.message });
  }
});


// EMERGENCY CASES
// GET /api/admin/emergency-cases  — joins petName for display.
// Optional filters: ?status=Published  &  ?petID=2
router.get("/emergency-cases", async (req, res) => {
  try {
    const { status, petID } = req.query;
    const conditions = [];
    const params = [];

    if (status) { conditions.push("ec.status = ?"); params.push(status); }
    if (petID)  { conditions.push("ec.petID = ?");  params.push(petID); }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const [cases] = await pool.query(
      `SELECT ec.emergencyID, ec.petID, p.petName, ec.topicTitle, ec.topicDesc,
              ec.severity, ec.keywords, ec.status, ec.created_at
       FROM emergency_cases ec
       JOIN pets p ON ec.petID = p.petID
       ${where}
       ORDER BY ec.created_at DESC`,
      params
    );
    res.json({ message: "Emergency cases loaded.", cases });
  } catch (error) {
    console.error("Admin get emergency cases error:", error);
    res.status(500).json({ message: "Server error loading emergency cases.", error: error.message });
  }
});

router.get("/emergency-cases/:id", async (req, res) => {
  try {
    const [cases] = await pool.query(
      `SELECT emergencyID, petID, topicTitle, topicDesc, severity, keywords, status, created_at
       FROM emergency_cases WHERE emergencyID = ?`,
      [req.params.id]
    );
    if (cases.length === 0) {
      return res.status(404).json({ message: "Emergency case not found." });
    }
    res.json({ message: "Emergency case loaded.", case: cases[0] });
  } catch (error) {
    console.error("Admin get emergency case error:", error);
    res.status(500).json({ message: "Server error loading emergency case.", error: error.message });
  }
});

router.post("/emergency-cases", async (req, res) => {
  try {
    const { petID, topicTitle, topicDesc, severity, keywords, status } = req.body;

    if (!petID || !topicTitle || !topicDesc || !severity) {
      return res.status(400).json({ message: "petID, topicTitle, topicDesc and severity are required." });
    }
    if (!["Critical", "Moderate", "Mild"].includes(severity)) {
      return res.status(400).json({ message: "Severity must be Critical, Moderate or Mild." });
    }

    const [result] = await pool.query(
      `INSERT INTO emergency_cases (petID, topicTitle, topicDesc, severity, keywords, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [petID, topicTitle, topicDesc, severity, keywords || null, status || "Draft"]
    );
    res.status(201).json({ message: "Emergency case created.", emergencyID: result.insertId });
  } catch (error) {
    console.error("Admin create emergency case error:", error);
    res.status(500).json({ message: "Server error creating emergency case.", error: error.message });
  }
});

router.put("/emergency-cases/:id", async (req, res) => {
  try {
    const { petID, topicTitle, topicDesc, severity, keywords, status } = req.body;

    if (!petID || !topicTitle || !topicDesc || !severity) {
      return res.status(400).json({ message: "petID, topicTitle, topicDesc and severity are required." });
    }

    const [result] = await pool.query(
      `UPDATE emergency_cases
       SET petID = ?, topicTitle = ?, topicDesc = ?, severity = ?, keywords = ?, status = ?
       WHERE emergencyID = ?`,
      [petID, topicTitle, topicDesc, severity, keywords || null, status || "Draft", req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Emergency case not found." });
    }
    res.json({ message: "Emergency case updated." });
  } catch (error) {
    console.error("Admin update emergency case error:", error);
    res.status(500).json({ message: "Server error updating emergency case.", error: error.message });
  }
});

router.delete("/emergency-cases/:id", async (req, res) => {
  try {
    const [result] = await pool.query(
      "DELETE FROM emergency_cases WHERE emergencyID = ?",
      [req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Emergency case not found." });
    }
    res.json({ message: "Emergency case deleted." });
  } catch (error) {
    console.error("Admin delete emergency case error:", error);
    res.status(500).json({ message: "Server error deleting emergency case.", error: error.message });
  }
});


// FIRST-AID GUIDES  (one guide per emergency case)
router.get("/guides", async (req, res) => {
  try {
    const [guides] = await pool.query(
      `SELECT g.guideID, g.emergencyID, ec.topicTitle, g.guideTitle, g.overview,
              g.steps, g.status, g.updated_at
       FROM first_aid_guides g
       JOIN emergency_cases ec ON g.emergencyID = ec.emergencyID
       ORDER BY g.updated_at DESC`
    );
    res.json({ message: "Guides loaded.", guides });
  } catch (error) {
    console.error("Admin get guides error:", error);
    res.status(500).json({ message: "Server error loading guides.", error: error.message });
  }
});

router.get("/guides/:id", async (req, res) => {
  try {
    const [guides] = await pool.query(
      `SELECT guideID, emergencyID, guideTitle, overview, steps, status, updated_at
       FROM first_aid_guides WHERE guideID = ?`,
      [req.params.id]
    );
    if (guides.length === 0) {
      return res.status(404).json({ message: "Guide not found." });
    }
    res.json({ message: "Guide loaded.", guide: guides[0] });
  } catch (error) {
    console.error("Admin get guide error:", error);
    res.status(500).json({ message: "Server error loading guide.", error: error.message });
  }
});

router.post("/guides", async (req, res) => {
  try {
    const { emergencyID, guideTitle, overview, steps, status } = req.body;

    if (!emergencyID || !guideTitle || !steps) {
      return res.status(400).json({ message: "emergencyID, guideTitle and steps are required." });
    }

    // Accept either an array of step strings or an already-stringified JSON array
    const stepsValue = Array.isArray(steps) ? JSON.stringify(steps) : steps;

    const [result] = await pool.query(
      `INSERT INTO first_aid_guides (emergencyID, guideTitle, overview, steps, status)
       VALUES (?, ?, ?, ?, ?)`,
      [emergencyID, guideTitle, overview || null, stepsValue, status || "Draft"]
    );
    res.status(201).json({ message: "Guide created.", guideID: result.insertId });
  } catch (error) {
    // emergencyID is UNIQUE on this table — a duplicate throws ER_DUP_ENTRY
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "This emergency case already has a guide." });
    }
    console.error("Admin create guide error:", error);
    res.status(500).json({ message: "Server error creating guide.", error: error.message });
  }
});

router.put("/guides/:id", async (req, res) => {
  try {
    const { guideTitle, overview, steps, status } = req.body;

    if (!guideTitle || !steps) {
      return res.status(400).json({ message: "guideTitle and steps are required." });
    }

    const stepsValue = Array.isArray(steps) ? JSON.stringify(steps) : steps;

    const [result] = await pool.query(
      `UPDATE first_aid_guides
       SET guideTitle = ?, overview = ?, steps = ?, status = ?
       WHERE guideID = ?`,
      [guideTitle, overview || null, stepsValue, status || "Draft", req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Guide not found." });
    }
    res.json({ message: "Guide updated." });
  } catch (error) {
    console.error("Admin update guide error:", error);
    res.status(500).json({ message: "Server error updating guide.", error: error.message });
  }
});

router.delete("/guides/:id", async (req, res) => {
  try {
    const [result] = await pool.query(
      "DELETE FROM first_aid_guides WHERE guideID = ?",
      [req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Guide not found." });
    }
    res.json({ message: "Guide deleted." });
  } catch (error) {
    console.error("Admin delete guide error:", error);
    res.status(500).json({ message: "Server error deleting guide.", error: error.message });
  }
});

// QUIZZES
router.get("/quizzes", async (req, res) => {
  try {
    const [quizzes] = await pool.query(
      `SELECT q.quizID, q.guideID, g.guideTitle, q.quizTitle, q.description,
              q.pass_mark, q.quizStatus, q.created_at
       FROM quizzes q
       JOIN first_aid_guides g ON q.guideID = g.guideID
       ORDER BY q.created_at DESC`
    );
    res.json({ message: "Quizzes loaded.", quizzes });
  } catch (error) {
    console.error("Admin get quizzes error:", error);
    res.status(500).json({ message: "Server error loading quizzes.", error: error.message });
  }
});

router.post("/quizzes", async (req, res) => {
  try {
    const { guideID, quizTitle, description, pass_mark, quizStatus } = req.body;
    if (!guideID || !quizTitle) {
      return res.status(400).json({ message: "guideID and quizTitle are required." });
    }
    const [result] = await pool.query(
      `INSERT INTO quizzes (guideID, quizTitle, description, pass_mark, quizStatus)
       VALUES (?, ?, ?, ?, ?)`,
      [guideID, quizTitle, description || null, pass_mark || 70, quizStatus || "draft"]
    );
    res.status(201).json({ message: "Quiz created.", quizID: result.insertId });
  } catch (error) {
    console.error("Admin create quiz error:", error);
    res.status(500).json({ message: "Server error creating quiz.", error: error.message });
  }
});

router.put("/quizzes/:id", async (req, res) => {
  try {
    const { quizTitle, description, pass_mark, quizStatus } = req.body;
    if (!quizTitle) {
      return res.status(400).json({ message: "quizTitle is required." });
    }
    const [result] = await pool.query(
      `UPDATE quizzes
       SET quizTitle = ?, description = ?, pass_mark = ?, quizStatus = ?
       WHERE quizID = ?`,
      [quizTitle, description || null, pass_mark || 70, quizStatus || "draft", req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Quiz not found." });
    }
    res.json({ message: "Quiz updated." });
  } catch (error) {
    console.error("Admin update quiz error:", error);
    res.status(500).json({ message: "Server error updating quiz.", error: error.message });
  }
});

router.delete("/quizzes/:id", async (req, res) => {
  try {
    const [result] = await pool.query("DELETE FROM quizzes WHERE quizID = ?", [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Quiz not found." });
    }
    res.json({ message: "Quiz deleted." });
  } catch (error) {
    console.error("Admin delete quiz error:", error);
    res.status(500).json({ message: "Server error deleting quiz.", error: error.message });
  }
});

// FEEDBACK REVIEW
// GET /api/admin/feedback  — newest first. Optional filter: ?status=new
router.get("/feedback", async (req, res) => {
  try {
    const { status } = req.query;
    const where = status ? "WHERE f.status = ?" : "";
    const params = status ? [status] : [];

    const [feedback] = await pool.query(
      `SELECT f.feedbackID, f.userID, u.name AS userName, u.email AS userEmail,
              f.emergencyID, ec.topicTitle, f.rating, f.message, f.status, f.submitted_at
       FROM feedback f
       JOIN users u ON f.userID = u.userID
       JOIN emergency_cases ec ON f.emergencyID = ec.emergencyID
       ${where}
       ORDER BY f.submitted_at DESC`,
      params
    );
    res.json({ message: "Feedback loaded.", feedback });
  } catch (error) {
    console.error("Admin get feedback error:", error);
    res.status(500).json({ message: "Server error loading feedback.", error: error.message });
  }
});

// PATCH /api/admin/feedback/:id/status  — mark reviewed
// Body: { "status": "new" | "reviewed" }
router.patch("/feedback/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!["new", "reviewed"].includes(status)) {
      return res.status(400).json({ message: "Status must be 'new' or 'reviewed'." });
    }
    const [result] = await pool.query(
      "UPDATE feedback SET status = ? WHERE feedbackID = ?",
      [status, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Feedback not found." });
    }
    res.json({ message: "Feedback status updated." });
  } catch (error) {
    console.error("Admin update feedback error:", error);
    res.status(500).json({ message: "Server error updating feedback.", error: error.message });
  }
});

router.delete("/feedback/:id", async (req, res) => {
  try {
    const [result] = await pool.query("DELETE FROM feedback WHERE feedbackID = ?", [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Feedback not found." });
    }
    res.json({ message: "Feedback deleted." });
  } catch (error) {
    console.error("Admin delete feedback error:", error);
    res.status(500).json({ message: "Server error deleting feedback.", error: error.message });
  }
});


// MEDIA  ->  /api/admin/media
router.get("/media", async (req, res) => {
  try {
    const { guideID } = req.query;
    const where = guideID ? "WHERE m.guideID = ?" : "";
    const params = guideID ? [guideID] : [];
    const [media] = await pool.query(
      `SELECT m.mediaID, m.guideID, g.guideTitle, m.media_type, m.mediaTitle,
              m.caption, m.mediaURL, m.mediaStatus, m.created_at
       FROM media m
       JOIN first_aid_guides g ON m.guideID = g.guideID
       ${where}
       ORDER BY m.created_at DESC`,
      params
    );
    res.json({ message: "Media loaded.", media });
  } catch (error) {
    console.error("Admin get media error:", error);
    res.status(500).json({ message: "Server error loading media.", error: error.message });
  }
});

router.post("/media", async (req, res) => {
  try {
    const { guideID, media_type, mediaTitle, caption, mediaURL, mediaStatus } = req.body;
    if (!guideID || !media_type || !mediaTitle || !mediaURL) {
      return res.status(400).json({ message: "guideID, media_type, mediaTitle and mediaURL are required." });
    }
    if (!["image", "video"].includes(media_type.toLowerCase())) {
      return res.status(400).json({ message: "media_type must be 'image' or 'video'." });
    }
    const [result] = await pool.query(
      `INSERT INTO media (guideID, media_type, mediaTitle, caption, mediaURL, mediaStatus)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [guideID, media_type.toLowerCase(), mediaTitle, caption || null, mediaURL, mediaStatus || "Draft"]
    );
    res.status(201).json({ message: "Media created.", mediaID: result.insertId });
  } catch (error) {
    console.error("Admin create media error:", error);
    res.status(500).json({ message: "Server error creating media.", error: error.message });
  }
});

router.put("/media/:id", async (req, res) => {
  try {
    const { guideID, media_type, mediaTitle, caption, mediaURL, mediaStatus } = req.body;
    if (!guideID || !media_type || !mediaTitle || !mediaURL) {
      return res.status(400).json({ message: "guideID, media_type, mediaTitle and mediaURL are required." });
    }
    const [result] = await pool.query(
      `UPDATE media SET guideID = ?, media_type = ?, mediaTitle = ?, caption = ?, mediaURL = ?, mediaStatus = ?
       WHERE mediaID = ?`,
      [guideID, media_type.toLowerCase(), mediaTitle, caption || null, mediaURL, mediaStatus || "Draft", req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: "Media not found." });
    res.json({ message: "Media updated." });
  } catch (error) {
    console.error("Admin update media error:", error);
    res.status(500).json({ message: "Server error updating media.", error: error.message });
  }
});

router.delete("/media/:id", async (req, res) => {
  try {
    const [result] = await pool.query("DELETE FROM media WHERE mediaID = ?", [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: "Media not found." });
    res.json({ message: "Media deleted." });
  } catch (error) {
    console.error("Admin delete media error:", error);
    res.status(500).json({ message: "Server error deleting media.", error: error.message });
  }
});


// VETERINARY ADVICE  ->  /api/admin/vet-advice
router.get("/vet-advice", async (req, res) => {
  try {
    const { guideID } = req.query;
    const where = guideID ? "WHERE va.guideID = ?" : "";
    const params = guideID ? [guideID] : [];
    const [advice] = await pool.query(
      `SELECT va.adviceID, va.guideID, g.guideTitle, va.advice_text,
              va.urgency, va.adviceStatus, va.created_at
       FROM veterinary_advice va
       JOIN first_aid_guides g ON va.guideID = g.guideID
       ${where}
       ORDER BY va.created_at DESC`,
      params
    );
    res.json({ message: "Vet advice loaded.", advice });
  } catch (error) {
    console.error("Admin get vet advice error:", error);
    res.status(500).json({ message: "Server error loading vet advice.", error: error.message });
  }
});

router.post("/vet-advice", async (req, res) => {
  try {
    const { guideID, advice_text, urgency, adviceStatus } = req.body;
    if (!guideID || !advice_text) {
      return res.status(400).json({ message: "guideID and advice_text are required." });
    }
    const [result] = await pool.query(
      `INSERT INTO veterinary_advice (guideID, advice_text, urgency, adviceStatus)
       VALUES (?, ?, ?, ?)`,
      [guideID, advice_text, urgency || "General", adviceStatus || "Draft"]
    );
    res.status(201).json({ message: "Vet advice created.", adviceID: result.insertId });
  } catch (error) {
    console.error("Admin create vet advice error:", error);
    res.status(500).json({ message: "Server error creating vet advice.", error: error.message });
  }
});

router.put("/vet-advice/:id", async (req, res) => {
  try {
    const { guideID, advice_text, urgency, adviceStatus } = req.body;
    if (!guideID || !advice_text) {
      return res.status(400).json({ message: "guideID and advice_text are required." });
    }
    const [result] = await pool.query(
      `UPDATE veterinary_advice SET guideID = ?, advice_text = ?, urgency = ?, adviceStatus = ?
       WHERE adviceID = ?`,
      [guideID, advice_text, urgency || "General", adviceStatus || "Draft", req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: "Vet advice not found." });
    res.json({ message: "Vet advice updated." });
  } catch (error) {
    console.error("Admin update vet advice error:", error);
    res.status(500).json({ message: "Server error updating vet advice.", error: error.message });
  }
});

router.delete("/vet-advice/:id", async (req, res) => {
  try {
    const [result] = await pool.query("DELETE FROM veterinary_advice WHERE adviceID = ?", [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: "Vet advice not found." });
    res.json({ message: "Vet advice deleted." });
  } catch (error) {
    console.error("Admin delete vet advice error:", error);
    res.status(500).json({ message: "Server error deleting vet advice.", error: error.message });
  }
});


// MEDIA  ->  /api/admin/media
router.get("/media", async (req, res) => {
  try {
    const { guideID } = req.query;
    const where = guideID ? "WHERE m.guideID = ?" : "";
    const params = guideID ? [guideID] : [];
    const [media] = await pool.query(
      `SELECT m.mediaID, m.guideID, g.guideTitle, m.media_type, m.mediaTitle,
              m.caption, m.mediaURL, m.mediaStatus, m.created_at
       FROM media m
       JOIN first_aid_guides g ON m.guideID = g.guideID
       ${where}
       ORDER BY m.created_at DESC`,
      params
    );
    res.json({ message: "Media loaded.", media });
  } catch (error) {
    console.error("Admin get media error:", error);
    res.status(500).json({ message: "Server error loading media.", error: error.message });
  }
});

router.post("/media", async (req, res) => {
  try {
    const { guideID, media_type, mediaTitle, caption, mediaURL, mediaStatus } = req.body;
    if (!guideID || !media_type || !mediaTitle || !mediaURL) {
      return res.status(400).json({ message: "guideID, media_type, mediaTitle and mediaURL are required." });
    }
    if (!["image", "video"].includes(media_type.toLowerCase())) {
      return res.status(400).json({ message: "media_type must be 'image' or 'video'." });
    }
    const [result] = await pool.query(
      `INSERT INTO media (guideID, media_type, mediaTitle, caption, mediaURL, mediaStatus)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [guideID, media_type.toLowerCase(), mediaTitle, caption || null, mediaURL, mediaStatus || "Draft"]
    );
    res.status(201).json({ message: "Media created.", mediaID: result.insertId });
  } catch (error) {
    console.error("Admin create media error:", error);
    res.status(500).json({ message: "Server error creating media.", error: error.message });
  }
});

router.put("/media/:id", async (req, res) => {
  try {
    const { guideID, media_type, mediaTitle, caption, mediaURL, mediaStatus } = req.body;
    if (!guideID || !media_type || !mediaTitle || !mediaURL) {
      return res.status(400).json({ message: "guideID, media_type, mediaTitle and mediaURL are required." });
    }
    const [result] = await pool.query(
      `UPDATE media SET guideID = ?, media_type = ?, mediaTitle = ?, caption = ?, mediaURL = ?, mediaStatus = ?
       WHERE mediaID = ?`,
      [guideID, media_type.toLowerCase(), mediaTitle, caption || null, mediaURL, mediaStatus || "Draft", req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: "Media not found." });
    res.json({ message: "Media updated." });
  } catch (error) {
    console.error("Admin update media error:", error);
    res.status(500).json({ message: "Server error updating media.", error: error.message });
  }
});

router.delete("/media/:id", async (req, res) => {
  try {
    const [result] = await pool.query("DELETE FROM media WHERE mediaID = ?", [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: "Media not found." });
    res.json({ message: "Media deleted." });
  } catch (error) {
    console.error("Admin delete media error:", error);
    res.status(500).json({ message: "Server error deleting media.", error: error.message });
  }
});


// VETERINARY ADVICE  ->  /api/admin/vet-advice
router.get("/vet-advice", async (req, res) => {
  try {
    const { guideID } = req.query;
    const where = guideID ? "WHERE va.guideID = ?" : "";
    const params = guideID ? [guideID] : [];
    const [advice] = await pool.query(
      `SELECT va.adviceID, va.guideID, g.guideTitle, va.advice_text,
              va.urgency, va.adviceStatus, va.created_at
       FROM veterinary_advice va
       JOIN first_aid_guides g ON va.guideID = g.guideID
       ${where}
       ORDER BY va.created_at DESC`,
      params
    );
    res.json({ message: "Vet advice loaded.", advice });
  } catch (error) {
    console.error("Admin get vet advice error:", error);
    res.status(500).json({ message: "Server error loading vet advice.", error: error.message });
  }
});

router.post("/vet-advice", async (req, res) => {
  try {
    const { guideID, advice_text, urgency, adviceStatus } = req.body;
    if (!guideID || !advice_text) {
      return res.status(400).json({ message: "guideID and advice_text are required." });
    }
    const [result] = await pool.query(
      `INSERT INTO veterinary_advice (guideID, advice_text, urgency, adviceStatus)
       VALUES (?, ?, ?, ?)`,
      [guideID, advice_text, urgency || "General", adviceStatus || "Draft"]
    );
    res.status(201).json({ message: "Vet advice created.", adviceID: result.insertId });
  } catch (error) {
    console.error("Admin create vet advice error:", error);
    res.status(500).json({ message: "Server error creating vet advice.", error: error.message });
  }
});

router.put("/vet-advice/:id", async (req, res) => {
  try {
    const { guideID, advice_text, urgency, adviceStatus } = req.body;
    if (!guideID || !advice_text) {
      return res.status(400).json({ message: "guideID and advice_text are required." });
    }
    const [result] = await pool.query(
      `UPDATE veterinary_advice SET guideID = ?, advice_text = ?, urgency = ?, adviceStatus = ?
       WHERE adviceID = ?`,
      [guideID, advice_text, urgency || "General", adviceStatus || "Draft", req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: "Vet advice not found." });
    res.json({ message: "Vet advice updated." });
  } catch (error) {
    console.error("Admin update vet advice error:", error);
    res.status(500).json({ message: "Server error updating vet advice.", error: error.message });
  }
});

router.delete("/vet-advice/:id", async (req, res) => {
  try {
    const [result] = await pool.query("DELETE FROM veterinary_advice WHERE adviceID = ?", [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: "Vet advice not found." });
    res.json({ message: "Vet advice deleted." });
  } catch (error) {
    console.error("Admin delete vet advice error:", error);
    res.status(500).json({ message: "Server error deleting vet advice.", error: error.message });
  }
});


// QUESTIONS  ->  /api/admin/questions
router.get("/questions", async (req, res) => {
  try {
    const { quizID } = req.query;
    const where = quizID ? "WHERE q.quizID = ?" : "";
    const params = quizID ? [quizID] : [];
    const [questions] = await pool.query(
      `SELECT q.questionID, q.quizID, q.text, q.order_num,
              GROUP_CONCAT(a.answerID ORDER BY a.answerID) AS answerIDs,
              GROUP_CONCAT(a.text ORDER BY a.answerID SEPARATOR '|||') AS answerTexts,
              GROUP_CONCAT(a.is_correct ORDER BY a.answerID) AS answerCorrect
       FROM questions q
       LEFT JOIN answers a ON a.questionID = q.questionID
       ${where}
       GROUP BY q.questionID
       ORDER BY q.order_num ASC`,
      params
    );
    res.json({ message: "Questions loaded.", questions });
  } catch (error) {
    console.error("Admin get questions error:", error);
    res.status(500).json({ message: "Server error loading questions.", error: error.message });
  }
});

router.post("/questions", async (req, res) => {
  try {
    const { quizID, text, options, correctAnswer, order_num } = req.body;
    if (!quizID || !text || !options || options.length < 2 || !correctAnswer) {
      return res.status(400).json({ message: "quizID, text, options (min 2) and correctAnswer are required." });
    }
    const [qResult] = await pool.query(
      "INSERT INTO questions (quizID, text, order_num) VALUES (?, ?, ?)",
      [quizID, text, order_num || 0]
    );
    const questionID = qResult.insertId;
    for (const option of options) {
      await pool.query(
        "INSERT INTO answers (questionID, text, is_correct) VALUES (?, ?, ?)",
        [questionID, option, option === correctAnswer ? 1 : 0]
      );
    }
    res.status(201).json({ message: "Question created.", questionID });
  } catch (error) {
    console.error("Admin create question error:", error);
    res.status(500).json({ message: "Server error creating question.", error: error.message });
  }
});

router.put("/questions/:id", async (req, res) => {
  try {
    const { text, options, correctAnswer, order_num } = req.body;
    if (!text || !options || options.length < 2 || !correctAnswer) {
      return res.status(400).json({ message: "text, options (min 2) and correctAnswer are required." });
    }
    await pool.query("UPDATE questions SET text = ?, order_num = ? WHERE questionID = ?", [text, order_num || 0, req.params.id]);
    await pool.query("DELETE FROM answers WHERE questionID = ?", [req.params.id]);
    for (const option of options) {
      await pool.query(
        "INSERT INTO answers (questionID, text, is_correct) VALUES (?, ?, ?)",
        [req.params.id, option, option === correctAnswer ? 1 : 0]
      );
    }
    res.json({ message: "Question updated." });
  } catch (error) {
    console.error("Admin update question error:", error);
    res.status(500).json({ message: "Server error updating question.", error: error.message });
  }
});

router.delete("/questions/:id", async (req, res) => {
  try {
    const [result] = await pool.query("DELETE FROM questions WHERE questionID = ?", [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: "Question not found." });
    res.json({ message: "Question deleted." });
  } catch (error) {
    console.error("Admin delete question error:", error);
    res.status(500).json({ message: "Server error deleting question.", error: error.message });
  }
});


// QUIZ RESULTS  ->  /api/admin/quiz-results
router.get("/quiz-results", async (req, res) => {
  try {
    const [results] = await pool.query(
      `SELECT qr.resultID, qr.userID, u.name AS userName, qr.quizID,
              qz.quizTitle, qr.score, qr.total_questions, qr.passed, qr.attempted_at
       FROM quiz_results qr
       JOIN users u ON qr.userID = u.userID
       JOIN quizzes qz ON qr.quizID = qz.quizID
       ORDER BY qr.attempted_at DESC`
    );
    res.json({ message: "Quiz results loaded.", results });
  } catch (error) {
    console.error("Admin get quiz results error:", error);
    res.status(500).json({ message: "Server error loading quiz results.", error: error.message });
  }
});

module.exports = router;