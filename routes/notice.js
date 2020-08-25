const express = require("express");
const router = express.Router();
const pool = require("../lib/pool");
const path = require("path");

router.get("/", async (req, res) => {
  let [noticePost] = await pool.query(
    `SELECT id, title, good, comment, count, date_format(created, '%y.%m.%d %H:%i') as created FROM notice_post WHERE status="visible" ORDER BY id DESC LIMIT 50`
  );
  const [[cot]] = await pool.query(
    `SELECT count(*) as counting FROM notice_post WHERE status="visible"`
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
  noticePost.map((post) =>
    post.created.substring(0, 8) === now
      ? (post.created = post.created.substring(9))
      : (post.created = post.created.substring(0, 8))
  );
  res.json({ noticePost, counting: cot.counting });
});

router.get("/page/:pageId", async (req, res) => {
  const pageId = path.parse(req.params.pageId).base;
  const offset = 50 * (pageId - 1);
  let [noticePost] = await pool.query(
    `SELECT id, title, good, comment, count, date_format(created, '%y.%m.%d %H:%i') as created FROM notice_post WHERE status="visible" ORDER BY id DESC LIMIT 50 OFFSET ${offset}`
  );
  const [[cot]] = await pool.query(
    `SELECT count(*) as counting FROM notice_post WHERE status="visible"`
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
  noticePost.map((post) =>
    post.created.substring(0, 8) === now
      ? (post.created = post.created.substring(9))
      : (post.created = post.created.substring(0, 8))
  );
  res.json({ noticePost, counting: cot.counting });
});

router.get("/page/:pageId/:postId", async (req, res) => {
  const pageId = path.parse(req.params.pageId).base;
  const offset = 50 * (pageId - 1);
  const postId = path.parse(req.params.postId).base;
  await pool.query(`UPDATE notice_post SET count=count+1 WHERE id=${postId}`);
  let [noticePost] = await pool.query(
    `SELECT id, title, good, comment, count, date_format(created, '%y.%m.%d %H:%i') as created FROM notice_post WHERE status="visible" ORDER BY id DESC LIMIT 50 OFFSET ${offset}`
  );
  const [[cot]] = await pool.query(
    `SELECT count(*) as counting FROM notice_post WHERE status="visible"`
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
  noticePost.map((post) =>
    post.created.substring(0, 8) === now
      ? (post.created = post.created.substring(9))
      : (post.created = post.created.substring(0, 8))
  );
  const [[post]] = await pool.query(
    `SELECT title, content, good, bad, comment, count, date_format(created, '%y.%m.%d %H:%i') as created FROM notice_post WHERE id=${postId}`
  );
  post.displayName = "매니저";
  const [commentList] = await pool.query(
    `SELECT notice_post_comment.id, user_id, users.displayName, email, content, date_format(created, '%y.%m.%d %H:%i') as created FROM notice_post_comment JOIN users ON user_id=users.id WHERE post_id=${postId}`
  );
  res.json({ noticePost, counting: cot.counting, post, commentList });
});

router.post("/good/process", async (req, res) => {
  const user_id = req.user.id;
  const postId = req.body.postId;
  const [good] = await pool.query(
    `SELECT user_id FROM notice_post_good WHERE post_id='${postId}'`
  );
  if (good.findIndex((obj) => obj.user_id == user_id) === -1) {
    await pool.query(
      `INSERT INTO notice_post_good(post_id, user_id) VALUES('${postId}','${user_id}')`
    );
    await pool.query(`UPDATE notice_post SET good=good+1 WHERE id=${postId}`);
    res.json("추천이 완료되었습니다.");
  } else {
    await pool.query(`DELETE FROM notice_post_good WHERE user_id='${user_id}'`);
    await pool.query(`UPDATE notice_post SET good=good-1 WHERE id=${postId}`);
    res.json("추천이 취소되었습니다.");
  }
});

router.post("/bad/process", async (req, res) => {
  const user_id = req.user.id;
  const postId = req.body.postId;
  const [bad] = await pool.query(
    `SELECT user_id FROM notice_post_bad WHERE post_id='${postId}'`
  );
  if (bad.findIndex((obj) => obj.user_id == user_id) === -1) {
    await pool.query(
      `INSERT INTO notice_post_bad(post_id, user_id) VALUES('${postId}','${user_id}')`
    );
    await pool.query(`UPDATE notice_post SET bad=bad+1 WHERE id=${postId}`);
    res.json("비추천이 완료되었습니다.");
  } else {
    await pool.query(`DELETE FROM notice_post_bad WHERE user_id='${user_id}'`);
    await pool.query(`UPDATE notice_post SET bad=bad-1 WHERE id=${postId}`);
    res.json("비추천이 취소되었습니다.");
  }
});

router.post("/goodbad/refresh", async (req, res) => {
  const postId = req.body.postId;
  const [[post]] = await pool.query(
    `SELECT good, bad FROM notice_post WHERE notice_post.id=${postId}`
  );
  res.json({ post });
});

router.post("/comment/create_process", async (req, res) => {
  const post_id = req.body.postId;
  const user_id = req.body.user_id;
  const content = req.body.comment;
  await pool.query(
    `INSERT INTO notice_post_comment(post_id, user_id, content) VALUES('${post_id}','${user_id}','${content}')`
  );
  await pool.query(
    `UPDATE notice_post SET comment=comment+1 WHERE id=${post_id}`
  );
  res.json({ process: true });
});

router.post("/comment/delete_process", async (req, res) => {
  const id = req.body.id;
  const post_id = req.body.post_id;
  await pool.query(`DELETE FROM notice_post_comment WHERE id=${id}`);
  await pool.query(
    `UPDATE notice_post SET comment=comment-1 WHERE id=${post_id}`
  );
  res.json({ process: true });
});

router.post("/comment/refresh", async (req, res) => {
  const postId = req.body.postId;
  const [commentList] = await pool.query(
    `SELECT notice_post_comment.id, user_id, email, content, date_format(created, '%y.%m.%d %H:%i') as created FROM notice_post_comment JOIN users ON user_id=users.id WHERE post_id=${postId}`
  );
  res.json({ commentList });
});

router.get("/search/:searchType/Keyword/:Keyword", async (req, res) => {
  const searchType = path.parse(req.params.searchType).base;
  const Keyword = path.parse(req.params.Keyword).base;
  let noticePost, counting, cot;
  switch (searchType) {
    case "all":
      [noticePost] = await pool.query(
        `SELECT notice_post.id, title, good, comment, count, date_format(created, '%y.%m.%d %H:%i') as created FROM notice_post WHERE title LIKE '%${Keyword}%' OR content LIKE '%${Keyword}%' ORDER BY notice_post.id DESC LIMIT 50`
      );
      [[cot]] = await pool.query(
        `SELECT count(*) as counting FROM notice_post WHERE title LIKE '%${Keyword}%' OR content LIKE '%${Keyword}%'`
      );
      counting = cot.counting;
      break;
    case "title":
      [noticePost] = await pool.query(
        `SELECT notice_post.id, title, good, comment, count, date_format(created, '%y.%m.%d %H:%i') as created FROM notice_post WHERE title LIKE '%${Keyword}%' ORDER BY notice_post.id DESC LIMIT 50`
      );
      [[cot]] = await pool.query(
        `SELECT count(*) as counting FROM notice_post WHERE title LIKE '%${Keyword}%'`
      );
      counting = cot.counting;
      break;
    case "content":
      [noticePost] = await pool.query(
        `SELECT notice_post.id, title, good, comment, count, date_format(created, '%y.%m.%d %H:%i') as created FROM notice_post WHERE content LIKE '%${Keyword}%' ORDER BY notice_post.id DESC LIMIT 50`
      );
      [[cot]] = await pool.query(
        `SELECT count(*) as counting FROM notice_post WHERE content LIKE '%${Keyword}%'`
      );
      counting = cot.counting;
      break;
    case "title+content":
      [noticePost] = await pool.query(
        `SELECT notice_post.id, title, good, comment, count, date_format(created, '%y.%m.%d %H:%i') as created FROM notice_post WHERE (title LIKE '%${Keyword}%' OR content LIKE '%${Keyword}%') ORDER BY notice_post.id DESC LIMIT 50`
      );
      [[cot]] = await pool.query(
        `SELECT count(*) as counting FROM notice_post WHERE (title LIKE '%${Keyword}%' OR content LIKE '%${Keyword}%')`
      );
      counting = cot.counting;
      break;
  }
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
  noticePost.map((post) =>
    post.created.substring(0, 8) === now
      ? (post.created = post.created.substring(9))
      : (post.created = post.created.substring(0, 8))
  );
  res.json({ counting, noticePost });
});

router.get(
  "/search/:searchType/Keyword/:Keyword/page/:pageId",
  async (req, res) => {
    const categoryId = path.parse(req.params.categoryId).base;
    const searchType = path.parse(req.params.searchType).base;
    const Keyword = path.parse(req.params.Keyword).base;
    const pageId = path.parse(req.params.pageId).base;
    const offset = 50 * (pageId - 1);
    const [category] = await pool.query(
      `SELECT name FROM category WHERE id=${categoryId}`
    );
    let noticePost, counting, cot;
    switch (searchType) {
      case "all":
        [noticePost] = await pool.query(
          `SELECT notice_post.id, title, good, comment, count, date_format(created, '%y.%m.%d %H:%i') as created FROM notice_post WHERE (title LIKE '%${Keyword}%' OR content LIKE '%${Keyword}%' ) ORDER BY notice_post.id DESC LIMIT 50 OFFSET ${offset}`
        );
        [[cot]] = await pool.query(
          `SELECT count(*) as counting FROM notice_post WHERE (title LIKE '%${Keyword}%' OR content LIKE '%${Keyword}%')`
        );
        counting = cot.counting;
        break;
      case "title":
        [noticePost] = await pool.query(
          `SELECT notice_post.id, title, good, comment, count, date_format(created, '%y.%m.%d %H:%i') as created FROM notice_post WHERE title LIKE '%${Keyword}%' ORDER BY notice_post.id DESC LIMIT 50 OFFSET ${offset}`
        );
        [[cot]] = await pool.query(
          `SELECT count(*) as counting FROM notice_post WHERE title LIKE '%${Keyword}%'`
        );
        counting = cot.counting;
        break;
      case "content":
        [noticePost] = await pool.query(
          `SELECT notice_post.id, title, good, comment, count, date_format(created, '%y.%m.%d %H:%i') as created FROM notice_post WHERE content LIKE '%${Keyword}%' ORDER BY notice_post.id DESC LIMIT 50 OFFSET ${offset}`
        );
        [[cot]] = await pool.query(
          `SELECT count(*) as counting FROM notice_post WHERE content LIKE '%${Keyword}%'`
        );
        counting = cot.counting;
        break;
      case "title+content":
        [noticePost] = await pool.query(
          `SELECT notice_post.id, title, good, comment, count, date_format(created, '%y.%m.%d %H:%i') as created FROM notice_post WHERE (title LIKE '%${Keyword}%' OR content LIKE '%${Keyword}%') ORDER BY notice_post.id DESC LIMIT 50 OFFSET ${offset}`
        );
        [[cot]] = await pool.query(
          `SELECT count(*) as counting FROM notice_post WHERE (title LIKE '%${Keyword}%' OR content LIKE '%${Keyword}%')`
        );
        counting = cot.counting;
        break;
    }
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
    noticePost.map((post) =>
      post.created.substring(0, 8) === now
        ? (post.created = post.created.substring(9))
        : (post.created = post.created.substring(0, 8))
    );
    res.json({ counting, noticePost });
  }
);

router.get(
  "/search/:searchType/Keyword/:Keyword/page/:pageId/:postId",
  async (req, res) => {
    const searchType = path.parse(req.params.searchType).base;
    const Keyword = path.parse(req.params.Keyword).base;
    const pageId = path.parse(req.params.pageId).base;
    const offset = 50 * (pageId - 1);
    const postId = path.parse(req.params.postId).base;
    await pool.query(`UPDATE notice_post SET count=count+1 WHERE id=${postId}`);
    let noticePost, counting, cot;
    switch (searchType) {
      case "all":
        [noticePost] = await pool.query(
          `SELECT notice_post.id, title, good, comment, count, date_format(created, '%y.%m.%d %H:%i') as created FROM notice_post WHERE (title LIKE '%${Keyword}%' OR content LIKE '%${Keyword}%' ) ORDER BY notice_post.id DESC LIMIT 50 OFFSET ${offset}`
        );
        [[cot]] = await pool.query(
          `SELECT count(*) as counting FROM notice_post WHERE (title LIKE '%${Keyword}%' OR content LIKE '%${Keyword}%' )`
        );
        counting = cot.counting;
        break;
      case "title":
        [noticePost] = await pool.query(
          `SELECT notice_post.id, title, good, comment, count, date_format(created, '%y.%m.%d %H:%i') as created FROM notice_post WHERE title LIKE '%${Keyword}%' ORDER BY notice_post.id DESC LIMIT 50 OFFSET ${offset}`
        );
        [[cot]] = await pool.query(
          `SELECT count(*) as counting FROM notice_post WHERE title LIKE '%${Keyword}%'`
        );
        counting = cot.counting;
        break;
      case "content":
        [noticePost] = await pool.query(
          `SELECT notice_post.id, title, good, comment, count, date_format(created, '%y.%m.%d %H:%i') as created FROM notice_post WHERE content LIKE '%${Keyword}%' ORDER BY notice_post.id DESC LIMIT 50 OFFSET ${offset}`
        );
        [[cot]] = await pool.query(
          `SELECT count(*) as counting FROM notice_post WHERE content LIKE '%${Keyword}%'`
        );
        counting = cot.counting;
        break;
      case "title+content":
        [noticePost] = await pool.query(
          `SELECT notice_post.id, title, good, comment, count, date_format(created, '%y.%m.%d %H:%i') as created FROM notice_post WHERE (title LIKE '%${Keyword}%' OR content LIKE '%${Keyword}%') ORDER BY notice_post.id DESC LIMIT 50 OFFSET ${offset}`
        );
        [[cot]] = await pool.query(
          `SELECT count(*) as counting FROM notice_post WHERE (title LIKE '%${Keyword}%' OR content LIKE '%${Keyword}%')`
        );
        counting = cot.counting;
        break;
    }
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
    noticePost.map((post) =>
      post.created.substring(0, 8) === now
        ? (post.created = post.created.substring(9))
        : (post.created = post.created.substring(0, 8))
    );
    const [[post]] = await pool.query(
      `SELECT title, content, good, bad, comment, count, date_format(created, '%y.%m.%d %H:%i') as created FROM notice_post WHERE notice_post.id=${postId}`
    );
    post.displayName = "매니저";
    const [commentList] = await pool.query(
      `SELECT notice_post_comment.id, user_id, users.displayName, email, content, date_format(created, '%y.%m.%d %H:%i') as created FROM notice_post_comment JOIN users ON user_id=users.id WHERE post_id=${postId}`
    );
    res.json({ counting, noticePost, post, commentList });
  }
);

module.exports = router;
