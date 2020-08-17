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

router.get("/yesterday", async (req, res) => {
  const today = new Date();
  let dd = today.getDate() + "";
  let mm = today.getMonth() + 1 + "";
  let yy = today.getFullYear() + "";
  if (dd < 10) {
    dd = "0" + dd;
  }
  if (mm < 10) {
    mm = "0" + mm;
  }
  dd = dd * 1 - 1;
  const nowSql = `${yy}-${mm}-${dd}`;
  const [[post]] = await pool.query(
    `SELECT count(*) as count FROM category_post WHERE created LIKE '${nowSql}%'`
  );
  const [[comment]] = await pool.query(
    `SELECT count(*) as count FROM category_post_comment WHERE created LIKE '${nowSql}%'`
  );
  res.json({ post: post.count, comment: comment.count });
});

module.exports = router;
