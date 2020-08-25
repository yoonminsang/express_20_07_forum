const express = require("express");
const router = express.Router();
const pool = require("../lib/pool");
const path = require("path");

router.get("/", async (req, res) => {
  let [hitPost] = await pool.query(
    `SELECT hit_post.id, title, users.displayName, good, comment, count, date_format(created, '%y.%m.%d %H:%i') as created FROM hit_post JOIN users ON user_id=users.id ORDER BY hit_post.id DESC LIMIT 50`
  );
  const [[cot]] = await pool.query(`SELECT count(*) as counting FROM hit_post`);
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
  hitPost.map((post) =>
    post.created.substring(0, 8) === now
      ? (post.created = post.created.substring(9))
      : (post.created = post.created.substring(0, 8))
  );
  res.json({ hitPost, counting: cot.counting });
});

router.get("/page/:pageId", async (req, res) => {
  const pageId = path.parse(req.params.pageId).base;
  const offset = 50 * (pageId - 1);
  let [hitPost] = await pool.query(
    `SELECT hit_post.id, title, users.displayName, good, comment, count, date_format(created, '%y.%m.%d %H:%i') as created FROM hit_post JOIN users ON user_id=users.id ORDER BY hit_post.id DESC LIMIT 50 OFFSET ${offset}`
  );
  const [[cot]] = await pool.query(`SELECT count(*) as counting FROM hit_post`);
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
  hitPost.map((post) =>
    post.created.substring(0, 8) === now
      ? (post.created = post.created.substring(9))
      : (post.created = post.created.substring(0, 8))
  );
  res.json({ hitPost, counting: cot.counting });
});

router.get("/page/:pageId/:postId", async (req, res) => {
  const pageId = path.parse(req.params.pageId).base;
  const offset = 50 * (pageId - 1);
  const postId = path.parse(req.params.postId).base;
  await pool.query(`UPDATE hit_post SET count=count+1 WHERE id=${postId}`);
  let [hitPost] = await pool.query(
    `SELECT hit_post.id, title, users.displayName, good, comment, count, date_format(created, '%y.%m.%d %H:%i') as created FROM hit_post JOIN users ON user_id=users.id ORDER BY hit_post.id DESC LIMIT 50 OFFSET ${offset}`
  );
  const [[cot]] = await pool.query(`SELECT count(*) as counting FROM hit_post`);
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
  hitPost.map((post) =>
    post.created.substring(0, 8) === now
      ? (post.created = post.created.substring(9))
      : (post.created = post.created.substring(0, 8))
  );
  const [[post]] = await pool.query(
    `SELECT title, content, users.displayName, email, good, bad, comment, count, date_format(created, '%y.%m.%d %H:%i') as created FROM hit_post JOIN users ON user_id=users.id WHERE hit_post.id=${postId}`
  );
  const [commentList] = await pool.query(
    `SELECT hit_post_comment.id, user_id, users.displayName, email, content, date_format(created, '%y.%m.%d %H:%i') as created FROM hit_post_comment JOIN users ON user_id=users.id WHERE post_id=${postId}`
  );
  //user_id 왜가져오냐 나중에 확인 함. 프론트 id말고 email로 비교해야돼 나중에 고쳐
  res.json({ hitPost, counting: cot.counting, post, commentList });
});

router.post("/good/process", async (req, res) => {
  const user_id = req.user.id;
  const postId = req.body.postId;
  const [good] = await pool.query(
    `SELECT user_id FROM hit_post_good WHERE post_id='${postId}'`
  );
  if (good.findIndex((obj) => obj.user_id == user_id) === -1) {
    await pool.query(
      `INSERT INTO hit_post_good(post_id, user_id) VALUES('${postId}','${user_id}')`
    );
    await pool.query(`UPDATE hit_post SET good=good+1 WHERE id=${postId}`);
    res.json("추천이 완료되었습니다.");
  } else {
    await pool.query(`DELETE FROM hit_post_good WHERE user_id='${user_id}'`);
    await pool.query(`UPDATE hit_post SET good=good-1 WHERE id=${postId}`);
    res.json("추천이 취소되었습니다.");
  }
});

router.post("/bad/process", async (req, res) => {
  const user_id = req.user.id;
  const postId = req.body.postId;
  const [bad] = await pool.query(
    `SELECT user_id FROM hit_post_bad WHERE post_id='${postId}'`
  );
  if (bad.findIndex((obj) => obj.user_id == user_id) === -1) {
    await pool.query(
      `INSERT INTO hit_post_bad(post_id, user_id) VALUES('${postId}','${user_id}')`
    );
    await pool.query(`UPDATE hit_post SET bad=bad+1 WHERE id=${postId}`);
    res.json("비추천이 완료되었습니다.");
  } else {
    await pool.query(`DELETE FROM hit_post_bad WHERE user_id='${user_id}'`);
    await pool.query(`UPDATE hit_post SET bad=bad-1 WHERE id=${postId}`);
    res.json("비추천이 취소되었습니다.");
  }
});

router.post("/goodbad/refresh", async (req, res) => {
  const postId = req.body.postId;
  const [[post]] = await pool.query(
    `SELECT good, bad FROM hit_post WHERE hit_post.id=${postId}`
  );
  res.json({ post });
});

router.post("/comment/create_process", async (req, res) => {
  const post_id = req.body.postId;
  const user_id = req.body.user_id;
  const content = req.body.comment;
  await pool.query(
    `INSERT INTO hit_post_comment(post_id, user_id, content) VALUES('${post_id}','${user_id}','${content}')`
  );
  await pool.query(`UPDATE hit_post SET comment=comment+1 WHERE id=${post_id}`);
  res.json({ process: true });
});

router.post("/comment/delete_process", async (req, res) => {
  const id = req.body.id;
  const post_id = req.body.post_id;
  await pool.query(`DELETE FROM hit_post_comment WHERE id=${id}`);
  await pool.query(`UPDATE hit_post SET comment=comment-1 WHERE id=${post_id}`);
  res.json({ process: true });
});

router.post("/comment/refresh", async (req, res) => {
  const postId = req.body.postId;
  const [commentList] = await pool.query(
    `SELECT hit_post_comment.id, user_id, users.displayName, email, content, date_format(created, '%y.%m.%d %H:%i') as created FROM hit_post_comment JOIN users ON user_id=users.id WHERE post_id=${postId}`
  );
  res.json({ commentList });
});

router.get("/search/:searchType/Keyword/:Keyword", async (req, res) => {
  const searchType = path.parse(req.params.searchType).base;
  const Keyword = path.parse(req.params.Keyword).base;
  let hitPost, counting, cot;
  switch (searchType) {
    case "all":
      [hitPost] = await pool.query(
        `SELECT hit_post.id, title, users.displayName, email, good, comment, count, date_format(created, '%y.%m.%d %H:%i') as created FROM hit_post JOIN users ON user_id=users.id WHERE (title LIKE '%${Keyword}%' OR content LIKE '%${Keyword}%' OR users.displayName='${Keyword}') ORDER BY hit_post.id DESC LIMIT 50`
      );
      [[cot]] = await pool.query(
        `SELECT count(*) as counting FROM hit_post JOIN users ON user_id=users.id WHERE (title LIKE '%${Keyword}%' OR content LIKE '%${Keyword}%' OR users.displayName='${Keyword}')`
      );
      counting = cot.counting;
      break;
    case "title":
      [hitPost] = await pool.query(
        `SELECT hit_post.id, title, users.displayName, email, good, comment, count, date_format(created, '%y.%m.%d %H:%i') as created FROM hit_post JOIN users ON user_id=users.id WHERE title LIKE '%${Keyword}%' ORDER BY hit_post.id DESC LIMIT 50`
      );
      [[cot]] = await pool.query(
        `SELECT count(*) as counting FROM hit_post JOIN users ON user_id=users.id WHERE title LIKE '%${Keyword}%'`
      );
      counting = cot.counting;
      break;
    case "content":
      [hitPost] = await pool.query(
        `SELECT hit_post.id, title, users.displayName, email, good, comment, count, date_format(created, '%y.%m.%d %H:%i') as created FROM hit_post JOIN users ON user_id=users.id WHERE content LIKE '%${Keyword}%' ORDER BY hit_post.id DESC LIMIT 50`
      );
      [[cot]] = await pool.query(
        `SELECT count(*) as counting FROM hit_post JOIN users ON user_id=users.id WHERE content LIKE '%${Keyword}%'`
      );
      counting = cot.counting;
      break;
    case "displayName":
      [hitPost] = await pool.query(
        `SELECT hit_post.id, title, users.displayName, email, good, comment, count, date_format(created, '%y.%m.%d %H:%i') as created FROM hit_post JOIN users ON user_id=users.id WHERE users.displayName='${Keyword}' ORDER BY hit_post.id DESC LIMIT 50`
      );
      [[cot]] = await pool.query(
        `SELECT count(*) as counting FROM hit_post JOIN users ON user_id=users.id WHERE users.displayName='${Keyword}'`
      );
      counting = cot.counting;
      break;
    case "title+content":
      [hitPost] = await pool.query(
        `SELECT hit_post.id, title, users.displayName, email, good, comment, count, date_format(created, '%y.%m.%d %H:%i') as created FROM hit_post JOIN users ON user_id=users.id WHERE (title LIKE '%${Keyword}%' OR content LIKE '%${Keyword}%') ORDER BY hit_post.id DESC LIMIT 50`
      );
      [[cot]] = await pool.query(
        `SELECT count(*) as counting FROM hit_post JOIN users ON user_id=users.id WHERE (title LIKE '%${Keyword}%' OR content LIKE '%${Keyword}%')`
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
  hitPost.map((post) =>
    post.created.substring(0, 8) === now
      ? (post.created = post.created.substring(9))
      : (post.created = post.created.substring(0, 8))
  );
  res.json({ counting, hitPost });
});

router.get(
  "/search/:searchType/Keyword/:Keyword/page/:pageId",
  async (req, res) => {
    const searchType = path.parse(req.params.searchType).base;
    const Keyword = path.parse(req.params.Keyword).base;
    const pageId = path.parse(req.params.pageId).base;
    const offset = 50 * (pageId - 1);
    let hitPost, counting, cot;
    switch (searchType) {
      case "all":
        [hitPost] = await pool.query(
          `SELECT hit_post.id, title, users.displayName, email, good, comment, count, date_format(created, '%y.%m.%d %H:%i') as created FROM hit_post JOIN users ON user_id=users.id WHERE (title LIKE '%${Keyword}%' OR content LIKE '%${Keyword}%' OR users.displayName='${Keyword}') ORDER BY hit_post.id DESC LIMIT 50 OFFSET ${offset}`
        );
        [[cot]] = await pool.query(
          `SELECT count(*) as counting FROM hit_post JOIN users ON user_id=users.id WHERE (title LIKE '%${Keyword}%' OR content LIKE '%${Keyword}%' OR users.displayName='${Keyword}')`
        );
        counting = cot.counting;
        break;
      case "title":
        [hitPost] = await pool.query(
          `SELECT hit_post.id, title, users.displayName, email, good, comment, count, date_format(created, '%y.%m.%d %H:%i') as created FROM hit_post JOIN users ON user_id=users.id WHERE title LIKE '%${Keyword}%' ORDER BY hit_post.id DESC LIMIT 50 OFFSET ${offset}`
        );
        [[cot]] = await pool.query(
          `SELECT count(*) as counting FROM hit_post JOIN users ON user_id=users.id WHERE title LIKE '%${Keyword}%'`
        );
        counting = cot.counting;
        break;
      case "content":
        [hitPost] = await pool.query(
          `SELECT hit_post.id, title, users.displayName, email, good, comment, count, date_format(created, '%y.%m.%d %H:%i') as created FROM hit_post JOIN users ON user_id=users.id WHERE content LIKE '%${Keyword}%' ORDER BY hit_post.id DESC LIMIT 50 OFFSET ${offset}`
        );
        [[cot]] = await pool.query(
          `SELECT count(*) as counting FROM hit_post JOIN users ON user_id=users.id WHERE content LIKE '%${Keyword}%'`
        );
        counting = cot.counting;
        break;
      case "displayName":
        [hitPost] = await pool.query(
          `SELECT hit_post.id, title, users.displayName, email, good, comment, count, date_format(created, '%y.%m.%d %H:%i') as created FROM hit_post JOIN users ON user_id=users.id WHERE users.displayName='${Keyword}' ORDER BY hit_post.id DESC LIMIT 50 OFFSET ${offset}`
        );
        [[cot]] = await pool.query(
          `SELECT count(*) as counting FROM hit_post JOIN users ON user_id=users.id WHERE users.displayName='${Keyword}'`
        );
        counting = cot.counting;
        break;
      case "title+content":
        [hitPost] = await pool.query(
          `SELECT hit_post.id, title, users.displayName, email, good, comment, count, date_format(created, '%y.%m.%d %H:%i') as created FROM hit_post JOIN users ON user_id=users.id WHERE (title LIKE '%${Keyword}%' OR content LIKE '%${Keyword}%') ORDER BY hit_post.id DESC LIMIT 50 OFFSET ${offset}`
        );
        [[cot]] = await pool.query(
          `SELECT count(*) as counting FROM hit_post JOIN users ON user_id=users.id WHERE (title LIKE '%${Keyword}%' OR content LIKE '%${Keyword}%')`
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
    hitPost.map((post) =>
      post.created.substring(0, 8) === now
        ? (post.created = post.created.substring(9))
        : (post.created = post.created.substring(0, 8))
    );
    res.json({ counting, hitPost });
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
    await pool.query(`UPDATE hit_post SET count=count+1 WHERE id=${postId}`);
    let hitPost, counting, cot;
    switch (searchType) {
      case "all":
        [hitPost] = await pool.query(
          `SELECT hit_post.id, title, users.displayName, email, good, comment, count, date_format(created, '%y.%m.%d %H:%i') as created FROM hit_post JOIN users ON user_id=users.id WHERE (title LIKE '%${Keyword}%' OR content LIKE '%${Keyword}%' OR users.displayName='${Keyword}') ORDER BY hit_post.id DESC LIMIT 50 OFFSET ${offset}`
        );
        [[cot]] = await pool.query(
          `SELECT count(*) as counting FROM hit_post JOIN users ON user_id=users.id WHERE (title LIKE '%${Keyword}%' OR content LIKE '%${Keyword}%' OR users.displayName='${Keyword}')`
        );
        counting = cot.counting;
        break;
      case "title":
        [hitPost] = await pool.query(
          `SELECT hit_post.id, title, users.displayName, email, good, comment, count, date_format(created, '%y.%m.%d %H:%i') as created FROM hit_post JOIN users ON user_id=users.id WHERE title LIKE '%${Keyword}%' ORDER BY hit_post.id DESC LIMIT 50 OFFSET ${offset}`
        );
        [[cot]] = await pool.query(
          `SELECT count(*) as counting FROM hit_post JOIN users ON user_id=users.id WHERE title LIKE '%${Keyword}%'`
        );
        counting = cot.counting;
        break;
      case "content":
        [hitPost] = await pool.query(
          `SELECT hit_post.id, title, users.displayName, email, good, comment, count, date_format(created, '%y.%m.%d %H:%i') as created FROM hit_post JOIN users ON user_id=users.id WHERE content LIKE '%${Keyword}%' ORDER BY hit_post.id DESC LIMIT 50 OFFSET ${offset}`
        );
        [[cot]] = await pool.query(
          `SELECT count(*) as counting FROM hit_post JOIN users ON user_id=users.id WHERE content LIKE '%${Keyword}%'`
        );
        counting = cot.counting;
        break;
      case "displayName":
        [hitPost] = await pool.query(
          `SELECT hit_post.id, title, users.displayName, email, good, comment, count, date_format(created, '%y.%m.%d %H:%i') as created FROM hit_post JOIN users ON user_id=users.id WHERE users.displayName='${Keyword}' ORDER BY hit_post.id DESC LIMIT 50 OFFSET ${offset}`
        );
        [[cot]] = await pool.query(
          `SELECT count(*) as counting FROM hit_post JOIN users ON user_id=users.id WHERE users.displayName='${Keyword}'`
        );
        counting = cot.counting;
        break;
      case "title+content":
        [hitPost] = await pool.query(
          `SELECT hit_post.id, title, users.displayName, email, good, comment, count, date_format(created, '%y.%m.%d %H:%i') as created FROM hit_post JOIN users ON user_id=users.id WHERE (title LIKE '%${Keyword}%' OR content LIKE '%${Keyword}%') ORDER BY hit_post.id DESC LIMIT 50 OFFSET ${offset}`
        );
        [[cot]] = await pool.query(
          `SELECT count(*) as counting FROM hit_post JOIN users ON user_id=users.id WHERE (title LIKE '%${Keyword}%' OR content LIKE '%${Keyword}%')`
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
    hitPost.map((post) =>
      post.created.substring(0, 8) === now
        ? (post.created = post.created.substring(9))
        : (post.created = post.created.substring(0, 8))
    );
    const [[post]] = await pool.query(
      `SELECT title, content, users.displayName, email, good, bad, comment, count, date_format(created, '%y.%m.%d %H:%i') as created FROM hit_post JOIN users ON user_id=users.id WHERE hit_post.id=${postId}`
    );
    const [commentList] = await pool.query(
      `SELECT hit_post_comment.id, user_id, users.displayName, email, content, date_format(created, '%y.%m.%d %H:%i') as created FROM hit_post_comment JOIN users ON user_id=users.id WHERE post_id=${postId}`
    );
    res.json({ counting, hitPost, post, commentList });
  }
);

module.exports = router;
