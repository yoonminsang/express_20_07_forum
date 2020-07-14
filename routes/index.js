const express = require("express");
const router = express.Router();
const pool = require("../lib/pool");
router.get("/", async (req, res) => {
  console.log(req);
  const user = req.user;
  console.log(user);
  res.json({ index: "index", user: user });
});

module.exports = router;
