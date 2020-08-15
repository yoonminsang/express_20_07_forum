const express = require("express");
const router = express.Router();
const pool = require("../lib/pool");
const path = require("path");

router.get("/:email", async (req, res) => {
  const email = path.parse(req.params.email).base;
  const [[displayName]] = await pool.query(
    `SELECT displayName FROM users where email='${email}'`
  );
  const [[postCount]] = await pool.query(
    `SELECT count(*) as count FROM users JOIN category_post ON users.id=user_id WHERE email='${email}'`
  );
  const [[commentCount]] = await pool.query(
    `SELECT count(*) as count FROM users JOIN category_post_comment ON users.id=user_id WHERE email='${email}'`
  );
  const [post] = await pool.query(
    `SELECT category_post.id as post_id, category_id, title, left(REGEXP_REPLACE(content, '<[^>]*>|\&([^;])*;', ''), 150) as content, date_format(created, '%y.%m.%d %H:%i') as created, name FROM category_post JOIN category ON category_id=category.id JOIN users ON user_id=users.id WHERE email='${email}' ORDER BY category_post.id DESC LIMIT 5`
  );
  const [comment] = await pool.query(
    `SELECT post_id, category_id, title, category_post_comment.content, date_format(category_post.created, '%y.%m.%d %H:%i') as created, name FROM category_post_comment JOIN category_post ON post_id=category_post.id JOIN category ON category_id=category.id JOIN users ON category_post_comment.user_id=users.id WHERE email='${email}' ORDER BY category_post_comment.id DESC LIMIT 5`
  );
  res.json({
    displayName: displayName.displayName,
    postCount: postCount.count,
    commentCount: commentCount.count,
    post,
    comment,
  });
});

router.get("/:email/:type", async (req, res) => {
  const email = path.parse(req.params.email).base;
  const type = path.parse(req.params.type).base;

  const [[displayName]] = await pool.query(
    `SELECT displayName FROM users where email='${email}'`
  );
  let count, content;
  if (type === "posting") {
    [[count]] = await pool.query(
      `SELECT count(*) as count FROM users JOIN category_post ON users.id=user_id WHERE email='${email}'`
    );
    [content] = await pool.query(
      `SELECT category_post.id as post_id, category_id, title, left(REGEXP_REPLACE(content, '<[^>]*>|\&([^;])*;', ''), 150) as content, date_format(created, '%y.%m.%d %H:%i') as created, name FROM category_post JOIN category ON category_id=category.id JOIN users ON user_id=users.id WHERE email='${email}' ORDER BY category_post.id DESC LIMIT 20`
    );
  } else if (type === "comment") {
    [[count]] = await pool.query(
      `SELECT count(*) as count FROM users JOIN category_post_comment ON users.id=user_id WHERE email='${email}'`
    );
    [content] = await pool.query(
      `SELECT post_id, category_id, title, category_post_comment.content, date_format(category_post.created, '%y.%m.%d %H:%i') as created, name FROM category_post_comment JOIN category_post ON post_id=category_post.id JOIN category ON category_id=category.id JOIN users ON category_post_comment.user_id=users.id WHERE email='${email}' ORDER BY category_post_comment.id DESC LIMIT 20`
    );
  }
  res.json({
    displayName: displayName.displayName,
    count: count.count,
    content,
  });
});

router.get("/:email/:type/page/:pageId", async (req, res) => {
  const email = path.parse(req.params.email).base;
  const type = path.parse(req.params.type).base;
  const pageId = path.parse(req.params.pageId).base;
  const offset = 20 * (pageId - 1);
  const [[displayName]] = await pool.query(
    `SELECT displayName FROM users where email='${email}'`
  );
  let count, content;
  if (type === "posting") {
    [[count]] = await pool.query(
      `SELECT count(*) as count FROM users JOIN category_post ON users.id=user_id WHERE email='${email}'`
    );
    [content] = await pool.query(
      `SELECT category_post.id as post_id, category_id, title, left(REGEXP_REPLACE(content, '<[^>]*>|\&([^;])*;', ''), 150) as content, date_format(created, '%y.%m.%d %H:%i') as created, name FROM category_post JOIN category ON category_id=category.id JOIN users ON user_id=users.id WHERE email='${email}' ORDER BY category_post.id DESC LIMIT 20 OFFSET ${offset}`
    );
  } else if (type === "comment") {
    [[count]] = await pool.query(
      `SELECT count(*) as count FROM users JOIN category_post_comment ON users.id=user_id WHERE email='${email}'`
    );
    [content] = await pool.query(
      `SELECT post_id, category_id, title, category_post_comment.content, date_format(category_post.created, '%y.%m.%d %H:%i') as created, name FROM category_post_comment JOIN category_post ON post_id=category_post.id JOIN category ON category_id=category.id JOIN users ON category_post_comment.user_id=users.id WHERE email='${email}' ORDER BY category_post_comment.id DESC LIMIT 20 OFFSET ${offset}`
    );
  }
  res.json({
    displayName: displayName.displayName,
    count: count.count,
    content,
  });
});

module.exports = router;
