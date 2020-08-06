const express = require("express");
const router = express.Router();
const pool = require("../lib/pool");
router.get("/logged", async (req, res) => {
  const user = req.user;
  if (user) {
    res.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        grade: user.grade,
      },
    });
  } else {
    res.json("not logged");
  }
});

module.exports = router;
