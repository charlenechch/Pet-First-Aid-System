const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const pool = require("../db");

const router = express.Router();

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
// GET MY PROFILE + USER PETS
// Final URL: GET /api/profile/me
// ==========================
router.get("/profile/me", verifyToken, async (req, res) => {
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
// UPDATE CURRENT USER PROFILE
// Final URL: PUT /api/profile/me
// ==========================
router.put("/profile/me", verifyToken, async (req, res) => {
  try {
    const userID = req.user.userID || req.user.userid || req.user.id;
    const { name, email, phone_no, bio } = req.body;

    if (!userID) {
      return res.status(401).json({
        message: "Invalid token. Please login again.",
      });
    }

    if (!name || !email || !phone_no) {
      return res.status(400).json({
        message: "Name, email and phone number are required.",
      });
    }

    const [existingUsers] = await pool.query(
      "SELECT userID FROM users WHERE email = ? AND userID != ?",
      [email, userID]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        message: "This email is already used by another account.",
      });
    }

    await pool.query(
      `
      UPDATE users
      SET name = ?, email = ?, phone_no = ?, bio = ?
      WHERE userID = ?
      `,
      [name, email, phone_no, bio || null, userID]
    );

    const [updatedUsers] = await pool.query(
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
// Final URL: PUT /api/profile/change-password
// ==========================
router.put("/profile/change-password", verifyToken, async (req, res) => {
  try {
    const userID = req.user.userID || req.user.userid || req.user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!userID) {
      return res.status(401).json({
        message: "Invalid token. Please login again.",
      });
    }

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
      [userID]
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
      userID,
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
// ADD PET TO DATABASE
// Final URL: POST /api/profile/pets
// ==========================
router.post("/profile/pets", verifyToken, async (req, res) => {
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
// Final URL: PUT /api/profile/pets/:userPetID
// ==========================
router.put("/profile/pets/:userPetID", verifyToken, async (req, res) => {
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
// Final URL: DELETE /api/profile/pets/:userPetID
// ==========================
router.delete("/profile/pets/:userPetID", verifyToken, async (req, res) => {
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
// GET MY BOOKMARKS
// Final URL: GET /api/petowner/bookmarks
// ==========================
router.get("/petowner/bookmarks", verifyToken, async (req, res) => {
  try {
    const userID = req.user.userID || req.user.userid || req.user.id;

    if (!userID) {
      return res.status(401).json({
        message: "Invalid token. Please login again.",
      });
    }

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
      [userID]
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
// Final URL: POST /api/petowner/bookmarks
// ==========================
router.post("/petowner/bookmarks", verifyToken, async (req, res) => {
  try {
    const userID = req.user.userID || req.user.userid || req.user.id;
    const { emergencyID } = req.body;

    if (!userID) {
      return res.status(401).json({
        message: "Invalid token. Please login again.",
      });
    }

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
      [userID, emergencyID]
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
// Final URL: DELETE /api/petowner/bookmarks/:emergencyID
// ==========================
router.delete("/petowner/bookmarks/:emergencyID", verifyToken, async (req, res) => {
  try {
    const userID = req.user.userID || req.user.userid || req.user.id;
    const { emergencyID } = req.params;

    if (!userID) {
      return res.status(401).json({
        message: "Invalid token. Please login again.",
      });
    }

    await pool.query(
      `
      DELETE FROM bookmarks
      WHERE userID = ?
      AND emergencyID = ?
      `,
      [userID, emergencyID]
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
// Final URL: GET /api/petowner/quizzes
// ==========================
router.get("/petowner/quizzes", verifyToken, async (req, res) => {
  try {
    const userID = req.user.userID || req.user.userid || req.user.id;

    if (!userID) {
      return res.status(401).json({
        message: "Invalid token. Please login again.",
      });
    }

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
      [userID]
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
// Final URL: GET /api/petowner/quizzes/:quizID
// ==========================
router.get("/petowner/quizzes/:quizID", verifyToken, async (req, res) => {
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
// Final URL: POST /api/petowner/quizzes/:quizID/submit
// ==========================
router.post("/petowner/quizzes/:quizID/submit", verifyToken, async (req, res) => {
  try {
    const userID = req.user.userID || req.user.userid || req.user.id;
    const { quizID } = req.params;
    const { answers } = req.body;

    if (!userID) {
      return res.status(401).json({
        message: "Invalid token. Please login again.",
      });
    }

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
        userID,
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
// Final URL: GET /api/petowner/dashboard
// ==========================
router.get("/petowner/dashboard", verifyToken, async (req, res) => {
  try {
    const userID = req.user.userID || req.user.userid || req.user.id;

    if (!userID) {
      return res.status(401).json({
        message: "Invalid token. Please login again.",
      });
    }

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

    const [bookmarkCountRows] = await pool.query(
      `
      SELECT COUNT(*) AS totalBookmarks
      FROM bookmarks
      WHERE userID = ?
      `,
      [userID]
    );

    const [quizCountRows] = await pool.query(
      `
      SELECT COUNT(*) AS totalQuizzes
      FROM quizzes
      WHERE quizStatus = 'published'
      `
    );

    const [attemptCountRows] = await pool.query(
      `
      SELECT COUNT(*) AS totalAttempts
      FROM quiz_results
      WHERE userID = ?
      `,
      [userID]
    );

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
// GET TOPICS FOR PET OWNER FEEDBACK
// Final URL: GET /api/petowner/feedback/topics
// ==========================
router.get("/petowner/feedback/topics", verifyToken, async (req, res) => {
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
// Final URL: GET /api/petowner/feedback
// ==========================
router.get("/petowner/feedback", verifyToken, async (req, res) => {
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
// Final URL: POST /api/petowner/feedback
// ==========================
router.post("/petowner/feedback", verifyToken, async (req, res) => {
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
// GET MY QUIZ RESULTS
// Show quiz results from database
// ==========================
router.get("/petowner/quiz-results", verifyToken, async (req, res) => {
  try {
    const userID = req.user.userID || req.user.userid || req.user.id;

    if (!userID) {
      return res.status(401).json({
        message: "Invalid token. Please login again.",
      });
    }

    const [results] = await pool.query(
      `
      SELECT 
        qr.resultID,
        qr.userID,
        qr.quizID,
        qr.score,
        qr.total_questions,
        qr.passed,
        qr.attempted_at,

        q.quizTitle,
        q.description,
        q.pass_mark,

        e.topicTitle,
        e.severity,

        p.petName,
        p.icon
      FROM quiz_results qr
      JOIN quizzes q ON qr.quizID = q.quizID
      JOIN first_aid_guides g ON q.guideID = g.guideID
      JOIN emergency_cases e ON g.emergencyID = e.emergencyID
      JOIN pets p ON e.petID = p.petID
      WHERE qr.userID = ?
      ORDER BY qr.attempted_at DESC
      `,
      [userID]
    );

    res.json({
      message: "Quiz results loaded successfully.",
      results,
    });
  } catch (error) {
    console.error("Load quiz results error:", error);

    res.status(500).json({
      message: "Server error while loading quiz results.",
      error: error.message,
    });
  }
});

module.exports = router;
