const express = require("express");
const router = express.Router();
const pool = require("../lib/pool");
const path = require("path");

router.get("/", async (req, res) => {
  const [subject] = await pool.query("SELECT * FROM subject");
  const [category] = await pool.query(
    "SELECT id, name, subject, counting FROM category"
  );

  let subject_category = [];
  for (let i = 1; i <= subject.length; i++) {
    subject_category.push(category.filter((cate) => cate.subject === i));
  }
  res.json({ subject, subject_category });
});

router.get("/:categoryId", async (req, res) => {
  const categoryId = path.parse(req.params.categoryId).base;
  const [category] = await pool.query(
    `SELECT name, counting FROM category WHERE id=${categoryId}`
  );
  let [categoryPost] = await pool.query(
    `SELECT category_post.id, title, users.displayName, good, comment, date_format(modified, '%y.%m.%d %h:%i') as created FROM category_post JOIN users ON user_id=users.id WHERE category_id=${categoryId} ORDER BY category_post.id DESC LIMIT 50`
  );
  const today = new Date();
  let dd = today.getDate() + "";
  let mm = today.getMonth() + 1 + "";
  const yy = (today.getFullYear() + "").substring(2);
  if (dd < 10) {
    dd = "0" + dd;
  }
  if (mm < 10) {
    mm = "0" + mm;
  }
  console.log(categoryPost[0]);
  categoryPost.map((post) =>
    post.created.substring(0, 8) === `${yy}.${mm}.${dd}`
      ? (post.created = post.created.substring(9))
      : (post.created = post.created.substring(0, 8))
  );
  console.log(categoryPost[0]);
  res.json({ category, categoryPost });
});

router.get("/:categoryId/page/:pageId", async (req, res) => {
  const categoryId = path.parse(req.params.categoryId).base;
  const pageId = path.parse(req.params.pageId).base;
  const offset = 50 * (pageId - 1);
  const [category] = await pool.query(
    `SELECT name, counting FROM category WHERE id=${categoryId}`
  );
  let [categoryPost] = await pool.query(
    `SELECT category_post.id, title, users.displayName, good, comment, date_format(modified, '%y.%m.%d %h:%i') as created FROM category_post JOIN users ON user_id=users.id WHERE category_id=${categoryId} ORDER BY category_post.id DESC LIMIT 50 OFFSET ${offset}`
  );
  const today = new Date();
  let dd = today.getDate() + "";
  let mm = today.getMonth() + 1 + "";
  const yy = (today.getFullYear() + "").substring(2);
  if (dd < 10) {
    dd = "0" + dd;
  }
  if (mm < 10) {
    mm = "0" + mm;
  }
  categoryPost.map((post) =>
    post.created.substring(0, 8) === `${yy}.${mm}.${dd}`
      ? (post.created = post.created.substring(9))
      : (post.created = post.created.substring(0, 8))
  );
  console.log(categoryPost[0]);
  res.json({ category, categoryPost });
});

module.exports = router;
