const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const pool = require("./db");
const adminRoutes = require("./routes/admin");

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

// ADMIN ROUTES  
app.use("/api/admin", adminRoutes);


// ==========================
// GET EMERGENCY TOPICS
// Search + filter by pet type/severity
// Public can view
// ==========================
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


// ==========================
// GET ONE EMERGENCY TOPIC DETAILS
// ==========================
app.get("/api/emergency-topics/:emergencyID", async (req, res) => {
  try {
    const { emergencyID } = req.params;

    const [topics] = await pool.query(
      `
      SELECT 
        e.emergencyID,
        e.topicTitle,
        e.topicDesc,
        e.severity,
        e.keywords,
        p.petName,
        p.icon,
        g.guideID,
        g.guideTitle,
        g.overview,
        g.steps,
        va.advice_text,
        va.urgency
      FROM emergency_cases e
      JOIN pets p ON e.petID = p.petID
      LEFT JOIN first_aid_guides g ON e.emergencyID = g.emergencyID
      LEFT JOIN veterinary_advice va ON g.guideID = va.guideID
      WHERE e.emergencyID = ?
      AND e.status = 'Published'
      `,
      [emergencyID]
    );

    if (topics.length === 0) {
      return res.status(404).json({
        message: "Emergency topic not found.",
      });
    }

    const topic = topics[0];

    let steps = [];

    try {
      steps = topic.steps ? JSON.parse(topic.steps) : [];
    } catch {
      steps = topic.steps ? topic.steps.split("\n") : [];
    }

    res.json({
      message: "Emergency topic details loaded successfully.",
      topic: {
        ...topic,
        steps,
      },
    });
  } catch (error) {
    console.error("Get topic details error:", error);
    res.status(500).json({
      message: "Server error while loading topic details.",
      error: error.message,
    });
  }
});


// ==========================
// GET MY BOOKMARKS
// Pet owner only
// ==========================
app.get("/api/petowner/bookmarks", verifyToken, async (req, res) => {
  try {
    const [bookmarks] = await pool.query(
      `
      SELECT 
        b.bookmarkID,
        b.saved_at,
        e.emergencyID,
        e.topicTitle,
        e.topicDesc,
        e.severity,
        p.petName,
        p.icon
      FROM bookmarks b
      JOIN emergency_cases e ON b.emergencyID = e.emergencyID
      JOIN pets p ON e.petID = p.petID
      WHERE b.userID = ?
      ORDER BY b.saved_at DESC
      `,
      [req.user.userID]
    );

    res.json({
      message: "Bookmarks loaded successfully.",
      bookmarks,
    });
  } catch (error) {
    console.error("Get bookmarks error:", error);
    res.status(500).json({
      message: "Server error while loading bookmarks.",
      error: error.message,
    });
  }
});

// ==========================
// ADD BOOKMARK
// ==========================
app.post("/api/petowner/bookmarks", verifyToken, async (req, res) => {
  try {
    const { emergencyID } = req.body;

    if (!emergencyID) {
      return res.status(400).json({
        message: "Emergency topic ID is required.",
      });
    }

    await pool.query(
      `
      INSERT IGNORE INTO bookmarks (userID, emergencyID)
      VALUES (?, ?)
      `,
      [req.user.userID, emergencyID]
    );

    res.json({
      message: "Topic bookmarked successfully.",
    });
  } catch (error) {
    console.error("Add bookmark error:", error);
    res.status(500).json({
      message: "Server error while adding bookmark.",
      error: error.message,
    });
  }
});

// ==========================
// REMOVE BOOKMARK
// ==========================
app.delete("/api/petowner/bookmarks/:emergencyID", verifyToken, async (req, res) => {
  try {
    const { emergencyID } = req.params;

    await pool.query(
      `
      DELETE FROM bookmarks
      WHERE userID = ?
      AND emergencyID = ?
      `,
      [req.user.userID, emergencyID]
    );

    res.json({
      message: "Bookmark removed successfully.",
    });
  } catch (error) {
    console.error("Remove bookmark error:", error);
    res.status(500).json({
      message: "Server error while removing bookmark.",
      error: error.message,
    });
  }
});

// ==========================
// GET QUIZ LIST
// ==========================
app.get("/api/petowner/quizzes", verifyToken, async (req, res) => {
  try {
    const [quizzes] = await pool.query(
      `
      SELECT 
        q.quizID,
        q.quizTitle,
        q.description,
        q.pass_mark,
        q.quizStatus,
        e.topicTitle,
        p.petName,
        p.icon,
        MAX(qr.score) AS bestScore,
        COUNT(qr.resultID) AS attempts
      FROM quizzes q
      JOIN first_aid_guides g ON q.guideID = g.guideID
      JOIN emergency_cases e ON g.emergencyID = e.emergencyID
      JOIN pets p ON e.petID = p.petID
      LEFT JOIN quiz_results qr 
        ON q.quizID = qr.quizID 
        AND qr.userID = ?
      WHERE q.quizStatus = 'published'
      GROUP BY 
        q.quizID,
        q.quizTitle,
        q.description,
        q.pass_mark,
        q.quizStatus,
        e.topicTitle,
        p.petName,
        p.icon
      ORDER BY q.created_at DESC
      `,
      [req.user.userID]
    );

    res.json({
      message: "Quizzes loaded successfully.",
      quizzes,
    });
  } catch (error) {
    console.error("Get quizzes error:", error);
    res.status(500).json({
      message: "Server error while loading quizzes.",
      error: error.message,
    });
  }
});

// ==========================
// GET QUIZ QUESTIONS
// ==========================
app.get("/api/petowner/quizzes/:quizID", verifyToken, async (req, res) => {
  try {
    const { quizID } = req.params;

    const [quizRows] = await pool.query(
      `
      SELECT quizID, quizTitle, description, pass_mark
      FROM quizzes
      WHERE quizID = ?
      AND quizStatus = 'published'
      `,
      [quizID]
    );

    if (quizRows.length === 0) {
      return res.status(404).json({
        message: "Quiz not found.",
      });
    }

    const [rows] = await pool.query(
      `
      SELECT 
        q.questionID,
        q.text AS questionText,
        q.order_num,
        a.answerID,
        a.text AS answerText
      FROM questions q
      JOIN answers a ON q.questionID = a.questionID
      WHERE q.quizID = ?
      ORDER BY q.order_num ASC, a.answerID ASC
      `,
      [quizID]
    );

    const questionsMap = {};

    rows.forEach((row) => {
      if (!questionsMap[row.questionID]) {
        questionsMap[row.questionID] = {
          questionID: row.questionID,
          questionText: row.questionText,
          answers: [],
        };
      }

      questionsMap[row.questionID].answers.push({
        answerID: row.answerID,
        answerText: row.answerText,
      });
    });

    res.json({
      message: "Quiz loaded successfully.",
      quiz: quizRows[0],
      questions: Object.values(questionsMap),
    });
  } catch (error) {
    console.error("Get quiz details error:", error);
    res.status(500).json({
      message: "Server error while loading quiz.",
      error: error.message,
    });
  }
});

// ==========================
// SUBMIT QUIZ
// ==========================
app.post("/api/petowner/quizzes/:quizID/submit", verifyToken, async (req, res) => {
  try {
    const { quizID } = req.params;
    const { answers } = req.body;

    if (!answers || Object.keys(answers).length === 0) {
      return res.status(400).json({
        message: "Please answer the quiz before submitting.",
      });
    }

    const [quizRows] = await pool.query(
      `
      SELECT quizID, quizTitle, pass_mark
      FROM quizzes
      WHERE quizID = ?
      AND quizStatus = 'published'
      `,
      [quizID]
    );

    if (quizRows.length === 0) {
      return res.status(404).json({
        message: "Quiz not found.",
      });
    }

    const quiz = quizRows[0];

    const [questionRows] = await pool.query(
      `
      SELECT questionID, text AS questionText
      FROM questions
      WHERE quizID = ?
      ORDER BY order_num ASC
      `,
      [quizID]
    );

    const [correctRows] = await pool.query(
      `
      SELECT 
        q.questionID,
        a.answerID,
        a.text AS correctAnswer
      FROM questions q
      JOIN answers a ON q.questionID = a.questionID
      WHERE q.quizID = ?
      AND a.is_correct = TRUE
      `,
      [quizID]
    );

    const correctMap = {};
    correctRows.forEach((row) => {
      correctMap[row.questionID] = {
        answerID: row.answerID,
        correctAnswer: row.correctAnswer,
      };
    });

    let correctCount = 0;

    const review = questionRows.map((question) => {
      const selectedAnswerID = Number(answers[question.questionID]);
      const correctAnswerID = Number(correctMap[question.questionID]?.answerID);

      const isCorrect = selectedAnswerID === correctAnswerID;

      if (isCorrect) correctCount += 1;

      return {
        questionID: question.questionID,
        questionText: question.questionText,
        selectedAnswerID,
        correctAnswerID,
        correctAnswer: correctMap[question.questionID]?.correctAnswer,
        isCorrect,
      };
    });

    const totalQuestions = questionRows.length;
    const score = Math.round((correctCount / totalQuestions) * 100);
    const passed = score >= quiz.pass_mark;

    const [insertResult] = await pool.query(
      `
      INSERT INTO quiz_results
      (userID, quizID, score, total_questions, passed, answers_json)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        req.user.userID,
        quizID,
        score,
        totalQuestions,
        passed,
        JSON.stringify(answers),
      ]
    );

    res.json({
      message: "Quiz submitted successfully.",
      result: {
        resultID: insertResult.insertId,
        quizID: quiz.quizID,
        quizTitle: quiz.quizTitle,
        passingScore: quiz.pass_mark,
        score,
        passed,
        correctCount,
        totalQuestions,
        review,
      },
    });
  } catch (error) {
    console.error("Submit quiz error:", error);
    res.status(500).json({
      message: "Server error while submitting quiz.",
      error: error.message,
    });
  }
});

// ==========================
// PET OWNER DASHBOARD
// ==========================
app.get("/api/petowner/dashboard", verifyToken, async (req, res) => {
  try {
    const userID = req.user.userID;

    if (!userID) {
      return res.status(401).json({
        message: "Invalid token. Please login again.",
      });
    }

    // Get pet owner profile based on petFirstAid.sql
    const [userRows] = await pool.query(
      `
      SELECT 
        userID,
        name,
        email,
        phone_no,
        role,
        status,
        bio,
        last_login,
        created_at
      FROM users
      WHERE userID = ?
      `,
      [userID]
    );

    if (userRows.length === 0) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    const user = userRows[0];

    // Total bookmarks
    const [bookmarkCountRows] = await pool.query(
      `
      SELECT COUNT(*) AS totalBookmarks
      FROM bookmarks
      WHERE userID = ?
      `,
      [userID]
    );

    // Total available quizzes
    const [quizCountRows] = await pool.query(
      `
      SELECT COUNT(*) AS totalQuizzes
      FROM quizzes
      WHERE quizStatus = 'published'
      `
    );

    // Total quiz attempts
    const [attemptCountRows] = await pool.query(
      `
      SELECT COUNT(*) AS totalAttempts
      FROM quiz_results
      WHERE userID = ?
      `,
      [userID]
    );

    // Recent bookmarked topics
    const [recentTopics] = await pool.query(
      `
      SELECT 
        b.bookmarkID,
        b.saved_at,
        e.emergencyID,
        e.topicTitle,
        e.severity,
        p.petName,
        p.icon
      FROM bookmarks b
      JOIN emergency_cases e ON b.emergencyID = e.emergencyID
      JOIN pets p ON e.petID = p.petID
      WHERE b.userID = ?
      ORDER BY b.saved_at DESC
      LIMIT 5
      `,
      [userID]
    );

    // Recent quiz attempts
    const [recentQuizAttempts] = await pool.query(
      `
      SELECT 
        qr.resultID,
        qr.score,
        qr.passed,
        qr.attempted_at,
        q.quizTitle
      FROM quiz_results qr
      JOIN quizzes q ON qr.quizID = q.quizID
      WHERE qr.userID = ?
      ORDER BY qr.attempted_at DESC
      LIMIT 5
      `,
      [userID]
    );

    res.json({
      message: "Pet owner dashboard loaded successfully.",
      profile: {
        userID: user.userID,
        name: user.name || "Pet Owner",
        email: user.email,
        phone_no: user.phone_no,
        role: user.role,
        status: user.status,
        bio: user.bio,
        last_login: user.last_login,
        created_at: user.created_at,
      },
      stats: {
        totalBookmarks: bookmarkCountRows[0].totalBookmarks || 0,
        totalQuizzes: quizCountRows[0].totalQuizzes || 0,
        totalAttempts: attemptCountRows[0].totalAttempts || 0,
      },
      recentTopics,
      recentQuizAttempts,
    });
  } catch (error) {
    console.error("Pet owner dashboard error:", error);

    res.status(500).json({
      message: "Server error while loading pet owner dashboard.",
      error: error.message,
    });
  }
});


// ==========================
// PET OWNER FEEDBACK
// Save feedback into database based on petFirstAid.sql
// ==========================
app.post("/api/petowner/feedback", verifyToken, async (req, res) => {
  try {
    const userID = req.user.userID || req.user.userid || req.user.id;
    const { emergencyID, rating, message } = req.body;

    if (!userID) {
      return res.status(401).json({
        message: "Invalid token. Please login again.",
      });
    }

    if (!emergencyID || !rating || !message) {
      return res.status(400).json({
        message: "Emergency topic, rating, and message are required.",
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5.",
      });
    }

    if (message.trim().length < 10) {
      return res.status(400).json({
        message: "Feedback message must be at least 10 characters.",
      });
    }

    const [topicRows] = await pool.query(
      `
      SELECT emergencyID
      FROM emergency_cases
      WHERE emergencyID = ?
      `,
      [emergencyID]
    );

    if (topicRows.length === 0) {
      return res.status(404).json({
        message: "Emergency topic not found.",
      });
    }

    const [result] = await pool.query(
      `
      INSERT INTO feedback
      (userID, emergencyID, rating, message, status)
      VALUES (?, ?, ?, ?, ?)
      `,
      [userID, emergencyID, rating, message.trim(), "new"]
    );

    res.json({
      message: "Feedback submitted successfully.",
      feedbackID: result.insertId,
    });
  } catch (error) {
    console.error("Submit pet owner feedback error:", error);

    res.status(500).json({
      message: "Server error while submitting feedback.",
      error: error.message,
    });
  }
});

// ==========================
// GET PUBLISHED TOPICS FOR FEEDBACK DROPDOWN
// ==========================
app.get("/api/petowner/feedback/topics", verifyToken, async (req, res) => {
  try {
    const [topics] = await pool.query(
      `
      SELECT 
        e.emergencyID,
        e.topicTitle,
        e.severity,
        p.petName,
        p.icon
      FROM emergency_cases e
      JOIN pets p ON e.petID = p.petID
      WHERE e.status = 'Published'
      ORDER BY e.topicTitle ASC
      `
    );

    res.json({
      message: "Feedback topics loaded successfully.",
      topics,
    });
  } catch (error) {
    console.error("Load feedback topics error:", error);

    res.status(500).json({
      message: "Server error while loading feedback topics.",
      error: error.message,
    });
  }
});


// ==========================
// GET MY PROFILE + USER PETS
// ==========================
app.get("/api/profile/me", verifyToken, async (req, res) => {
  try {
    const userID = req.user.userID || req.user.userid || req.user.id;

    if (!userID) {
      return res.status(401).json({
        message: "Invalid token. Please login again.",
      });
    }

    const [users] = await pool.query(
      `
      SELECT 
        userID,
        name,
        email,
        phone_no,
        role,
        status,
        bio,
        created_at,
        last_login
      FROM users
      WHERE userID = ?
      `,
      [userID]
    );

    if (users.length === 0) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    const [pets] = await pool.query(
      `
      SELECT 
        up.userPetID,
        up.userID,
        up.petID,
        up.userPetName,
        up.breed,
        up.created_at,
        p.petName,
        p.icon
      FROM user_pets up
      JOIN pets p ON up.petID = p.petID
      WHERE up.userID = ?
      ORDER BY up.userPetID DESC
      `,
      [userID]
    );

    res.json({
      message: "Profile loaded successfully.",
      user: users[0],
      pets,
    });
  } catch (error) {
    console.error("Load profile error:", error);

    res.status(500).json({
      message: "Server error while loading profile.",
      error: error.message,
    });
  }
});


// ==========================
// ADD PET TO DATABASE
// ==========================
app.post("/api/profile/pets", verifyToken, async (req, res) => {
  try {
    const userID = req.user.userID || req.user.userid || req.user.id;
    const { type, name, breed } = req.body;

    if (!userID) {
      return res.status(401).json({
        message: "Invalid token. Please login again.",
      });
    }

    if (!type || !name) {
      return res.status(400).json({
        message: "Pet type and pet name are required.",
      });
    }

    const [petTypeRows] = await pool.query(
      `
      SELECT petID, petName, icon
      FROM pets
      WHERE petName = ?
      LIMIT 1
      `,
      [type]
    );

    if (petTypeRows.length === 0) {
      return res.status(404).json({
        message: "Pet type not found in pets table.",
      });
    }

    const petType = petTypeRows[0];

    const [result] = await pool.query(
      `
      INSERT INTO user_pets
      (userID, petID, userPetName, breed)
      VALUES (?, ?, ?, ?)
      `,
      [userID, petType.petID, name.trim(), breed ? breed.trim() : ""]
    );

    res.json({
      message: "Pet added successfully.",
      pet: {
        userPetID: result.insertId,
        userID,
        petID: petType.petID,
        userPetName: name.trim(),
        breed: breed ? breed.trim() : "",
        petName: petType.petName,
        icon: petType.icon,
      },
    });
  } catch (error) {
    console.error("Add pet error:", error);

    res.status(500).json({
      message: "Server error while adding pet.",
      error: error.message,
    });
  }
});


// ==========================
// UPDATE PET IN DATABASE
// ==========================
app.put("/api/profile/pets/:userPetID", verifyToken, async (req, res) => {
  try {
    const userID = req.user.userID || req.user.userid || req.user.id;
    const { userPetID } = req.params;
    const { type, name, breed } = req.body;

    if (!userID) {
      return res.status(401).json({
        message: "Invalid token. Please login again.",
      });
    }

    if (!type || !name) {
      return res.status(400).json({
        message: "Pet type and pet name are required.",
      });
    }

    const [petTypeRows] = await pool.query(
      `
      SELECT petID, petName, icon
      FROM pets
      WHERE petName = ?
      LIMIT 1
      `,
      [type]
    );

    if (petTypeRows.length === 0) {
      return res.status(404).json({
        message: "Pet type not found in pets table.",
      });
    }

    const petType = petTypeRows[0];

    const [updateResult] = await pool.query(
      `
      UPDATE user_pets
      SET 
        petID = ?,
        userPetName = ?,
        breed = ?
      WHERE userPetID = ?
      AND userID = ?
      `,
      [
        petType.petID,
        name.trim(),
        breed ? breed.trim() : "",
        userPetID,
        userID,
      ]
    );

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({
        message: "Pet not found or you do not have permission to edit it.",
      });
    }

    res.json({
      message: "Pet updated successfully.",
      pet: {
        userPetID: Number(userPetID),
        userID,
        petID: petType.petID,
        userPetName: name.trim(),
        breed: breed ? breed.trim() : "",
        petName: petType.petName,
        icon: petType.icon,
      },
    });
  } catch (error) {
    console.error("Update pet error:", error);

    res.status(500).json({
      message: "Server error while updating pet.",
      error: error.message,
    });
  }
});


// ==========================
// DELETE PET FROM DATABASE
// ==========================
app.delete("/api/profile/pets/:userPetID", verifyToken, async (req, res) => {
  try {
    const userID = req.user.userID || req.user.userid || req.user.id;
    const { userPetID } = req.params;

    if (!userID) {
      return res.status(401).json({
        message: "Invalid token. Please login again.",
      });
    }

    const [deleteResult] = await pool.query(
      `
      DELETE FROM user_pets
      WHERE userPetID = ?
      AND userID = ?
      `,
      [userPetID, userID]
    );

    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({
        message: "Pet not found or you do not have permission to remove it.",
      });
    }

    res.json({
      message: "Pet removed successfully.",
    });
  } catch (error) {
    console.error("Delete pet error:", error);

    res.status(500).json({
      message: "Server error while deleting pet.",
      error: error.message,
    });
  }
});

// ==========================
// GET TOPICS FOR PET OWNER FEEDBACK
// ==========================
app.get("/api/petowner/feedback/topics", verifyToken, async (req, res) => {
  try {
    const [topics] = await pool.query(
      `
      SELECT 
        e.emergencyID,
        e.topicTitle,
        e.severity,
        p.petName,
        p.icon
      FROM emergency_cases e
      JOIN pets p ON e.petID = p.petID
      WHERE e.status = 'Published'
      ORDER BY e.topicTitle ASC
      `
    );

    res.json({
      message: "Feedback topics loaded successfully.",
      topics,
    });
  } catch (error) {
    console.error("Load feedback topics error:", error);

    res.status(500).json({
      message: "Server error while loading feedback topics.",
      error: error.message,
    });
  }
});


// ==========================
// GET MY FEEDBACK HISTORY
// ==========================
app.get("/api/petowner/feedback", verifyToken, async (req, res) => {
  try {
    const userID = req.user.userID || req.user.userid || req.user.id;

    if (!userID) {
      return res.status(401).json({
        message: "Invalid token. Please login again.",
      });
    }

    const [feedback] = await pool.query(
      `
      SELECT 
        f.feedbackID,
        f.userID,
        f.emergencyID,
        f.rating,
        f.message,
        f.status,
        f.submitted_at,
        e.topicTitle,
        e.severity,
        p.petName,
        p.icon,
        u.name,
        u.email
      FROM feedback f
      JOIN emergency_cases e ON f.emergencyID = e.emergencyID
      JOIN pets p ON e.petID = p.petID
      JOIN users u ON f.userID = u.userID
      WHERE f.userID = ?
      ORDER BY f.submitted_at DESC
      `,
      [userID]
    );

    res.json({
      message: "Feedback history loaded successfully.",
      feedback,
    });
  } catch (error) {
    console.error("Load feedback history error:", error);

    res.status(500).json({
      message: "Server error while loading feedback history.",
      error: error.message,
    });
  }
});


// ==========================
// SUBMIT PET OWNER FEEDBACK
// ==========================
app.post("/api/petowner/feedback", verifyToken, async (req, res) => {
  try {
    const userID = req.user.userID || req.user.userid || req.user.id;
    const { emergencyID, rating, message } = req.body;

    if (!userID) {
      return res.status(401).json({
        message: "Invalid token. Please login again.",
      });
    }

    if (!emergencyID || !rating || !message) {
      return res.status(400).json({
        message: "Topic, rating, and message are required.",
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

    const [topicRows] = await pool.query(
      `
      SELECT emergencyID
      FROM emergency_cases
      WHERE emergencyID = ?
      `,
      [emergencyID]
    );

    if (topicRows.length === 0) {
      return res.status(404).json({
        message: "Selected topic does not exist.",
      });
    }

    const [result] = await pool.query(
      `
      INSERT INTO feedback
      (userID, emergencyID, rating, message, status)
      VALUES (?, ?, ?, ?, ?)
      `,
      [userID, emergencyID, rating, message.trim(), "new"]
    );

    res.json({
      message: "Feedback submitted successfully.",
      feedbackID: result.insertId,
    });
  } catch (error) {
    console.error("Submit feedback error:", error);

    res.status(500).json({
      message: "Server error while submitting feedback.",
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