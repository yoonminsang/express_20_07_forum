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
  const title = category[0].name;
  const counting = category[0].counting;
  let [categoryPost] = await pool.query(
    `SELECT category_post.id, title, users.displayName, good, comment, count, date_format(modified, '%y.%m.%d %H:%i') as created FROM category_post JOIN users ON user_id=users.id WHERE category_id=${categoryId} ORDER BY category_post.id DESC LIMIT 50`
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
  const now = `${yy}.${mm}.${dd}`;
  categoryPost.map((post) =>
    post.created.substring(0, 8) === now
      ? (post.created = post.created.substring(9))
      : (post.created = post.created.substring(0, 8))
  );
  res.json({ title, counting, categoryPost });
});

router.get("/:categoryId/page/:pageId", async (req, res) => {
  const categoryId = path.parse(req.params.categoryId).base;
  const pageId = path.parse(req.params.pageId).base;
  const offset = 50 * (pageId - 1);
  const [category] = await pool.query(
    `SELECT name, counting FROM category WHERE id=${categoryId}`
  );
  const title = category[0].name;
  const counting = category[0].counting;
  let [categoryPost] = await pool.query(
    `SELECT category_post.id, title, users.displayName, good, comment, count, date_format(modified, '%y.%m.%d %H:%i') as created FROM category_post JOIN users ON user_id=users.id WHERE category_id=${categoryId} ORDER BY category_post.id DESC LIMIT 50 OFFSET ${offset}`
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
  const now = `${yy}.${mm}.${dd}`;
  categoryPost.map((post) =>
    post.created.substring(0, 8) === now
      ? (post.created = post.created.substring(9))
      : (post.created = post.created.substring(0, 8))
  );
  res.json({ title, counting, categoryPost });
});

router.get("/:categoryId/page/:pageId/:postId", async (req, res) => {
  const categoryId = path.parse(req.params.categoryId).base;
  const pageId = path.parse(req.params.pageId).base;
  const offset = 50 * (pageId - 1);
  const postId = path.parse(req.params.postId).base;
  const [category] = await pool.query(
    `SELECT name, counting FROM category WHERE id=${categoryId}`
  );
  const title = category[0].name;
  const counting = category[0].counting;
  let [categoryPost] = await pool.query(
    `SELECT category_post.id, title, users.displayName, good, comment, count, date_format(modified, '%y.%m.%d %H:%i') as created FROM category_post JOIN users ON user_id=users.id WHERE category_id=${categoryId} ORDER BY category_post.id DESC LIMIT 50 OFFSET ${offset}`
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
  const now = `${yy}.${mm}.${dd}`;
  categoryPost.map((post) =>
    post.created.substring(0, 8) === now
      ? (post.created = post.created.substring(9))
      : (post.created = post.created.substring(0, 8))
  );
  const [[post]] = await pool.query(
    `SELECT title, content, users.displayName, good, bad, comment, count, date_format(modified, '%y.%m.%d %H:%i') as created FROM category_post JOIN users ON user_id=users.id WHERE category_id=${categoryId} AND category_post.id=${postId}`
  );
  res.json({ title, counting, categoryPost, post });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////모드

router.get("/:categoryId/mode/:modeType", async (req, res) => {
  const categoryId = path.parse(req.params.categoryId).base;
  const modeType = path.parse(req.params.modeType).base;
  const [[category]] = await pool.query(
    `SELECT name FROM category WHERE id=${categoryId}`
  );
  const title = category.name;
  let counting, categoryPost;
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
  const nowSql = `${yy}-${mm}-${dd}`;
  if (modeType === "recommend") {
    [categoryPost] = await pool.query(
      `SELECT category_post.id, title, users.displayName, good, comment, count, date_format(modified, '%y.%m.%d %H:%i') as created FROM category_post JOIN users ON user_id=users.id WHERE category_id=${categoryId} AND created LIKE '${nowSql}%' AND good>0 ORDER BY good DESC LIMIT 50`
    );
    const [cot] = await pool.query(
      `SELECT count(*) as counting FROM category_post WHERE category_id=${categoryId} AND created LIKE '${nowSql}%' AND good>0`
    );
    counting = cot.counting;
  } else if (modeType === "notice") {
    [categoryPost] = await pool.query(
      `SELECT id, title, good, comment, count, date_format(modified, '%y.%m.%d %H:%i') as created FROM notice_post ORDER BY id DESC LIMIT 50`
    );
    categoryPost = categoryPost.map((post) => ({
      ...post,
      displayName: "매니저",
    }));
    const [[cot]] = await pool.query(`SELECT counting FROM notice_counting`);
    counting = cot.counting;
  }
  yy = yy.substring(2);
  const now = `${yy}.${mm}.${dd}`;
  categoryPost.map((post) =>
    post.created.substring(0, 8) === now
      ? (post.created = post.created.substring(9))
      : (post.created = post.created.substring(0, 8))
  );
  res.json({ title, counting, categoryPost });
});

router.get("/:categoryId/mode/:modeType/page/:pageId", async (req, res) => {
  const categoryId = path.parse(req.params.categoryId).base;
  const modeType = path.parse(req.params.modeType).base;
  const pageId = path.parse(req.params.pageId).base;
  const offset = 50 * (pageId - 1);
  const [[category]] = await pool.query(
    `SELECT name FROM category WHERE id=${categoryId}`
  );
  const title = category.name;
  let counting, categoryPost;
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
  const nowSql = `${yy}-${mm}-${dd}`;
  if (modeType === "recommend") {
    [categoryPost] = await pool.query(
      `SELECT category_post.id, title, users.displayName, good, comment, count, date_format(modified, '%y.%m.%d %H:%i') as created FROM category_post JOIN users ON user_id=users.id WHERE category_id=${categoryId} AND created LIKE '${nowSql}%' AND good>0 ORDER BY good DESC LIMIT 50 OFFSET ${offset}`
    );
    const [cot] = await pool.query(
      `SELECT count(*) as counting FROM category_post WHERE category_id=${categoryId} AND created LIKE '${nowSql}%' AND good>0`
    );
    counting = cot.counting;
  } else if (modeType === "notice") {
    [categoryPost] = await pool.query(
      `SELECT id, title, good, comment, count, date_format(modified, '%y.%m.%d %H:%i') as created FROM notice_post ORDER BY id DESC LIMIT 50 OFFSET ${offset}`
    );
    categoryPost = categoryPost.map((post) => ({
      ...post,
      displayName: "매니저",
    }));
    const [[cot]] = await pool.query(`SELECT counting FROM notice_counting`);
    counting = cot.counting;
  }
  yy = yy.substring(2);
  const now = `${yy}.${mm}.${dd}`;
  categoryPost.map((post) =>
    post.created.substring(0, 8) === now
      ? (post.created = post.created.substring(9))
      : (post.created = post.created.substring(0, 8))
  );
  res.json({ title, counting, categoryPost });
});

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////crud

router.get("/:categoryId/write", async (req, res) => {
  const categoryId = path.parse(req.params.categoryId).base;
  const [category] = await pool.query(
    `SELECT name, counting FROM category WHERE id=${categoryId}`
  );
  const title = category[0].name;

  res.json({ title });
});

router.post("/:categoryId/write/process", async (req, res) => {
  const categoryId = path.parse(req.params.categoryId).base;
  const user_id = req.body.user_id;
  const title = req.body.title;
  const content = req.body.content;
  await pool.query(
    `INSERT INTO category_post(category_id, user_id, title, content) VALUES('${categoryId}','${user_id}','${title}','${content}')`
  );
  res.json({ process: true });
});

module.exports = router;
