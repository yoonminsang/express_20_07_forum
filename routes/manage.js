const express = require("express");
const router = express.Router();
const pool = require("../lib/pool");
router.get("/category", async (req, res) => {
  const [category] = await pool.query(
    "SELECT category.name, subject as subject_id, subject.name as subject_name, counting FROM category JOIN subject ON category.subject=subject.id"
  );
  const [subject] = await pool.query("SELECT * FROM subject");
  res.json({ category, subject });
});

module.exports = router;
