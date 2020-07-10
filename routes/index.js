const express = require("express");
const router = express.Router();
const pool = require("../lib/pool");
router.get("/", async (req, res) => {
  const login = () => {
    if (req.user) {
      return true;
    } else {
      return false;
    }
  };

  res.json({ login: login() });
});

module.exports = router;
