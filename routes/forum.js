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
    `SELECT category_post.id, title, users.displayName, email, good, comment, count, date_format(created, '%y.%m.%d %H:%i') as created FROM category_post JOIN users ON user_id=users.id WHERE category_id=${categoryId} ORDER BY category_post.id DESC LIMIT 50`
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
    `SELECT category_post.id, title, users.displayName, email, good, comment, count, date_format(created, '%y.%m.%d %H:%i') as created FROM category_post JOIN users ON user_id=users.id WHERE category_id=${categoryId} ORDER BY category_post.id DESC LIMIT 50 OFFSET ${offset}`
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
  await pool.query(`UPDATE category_post SET count=count+1 WHERE id=${postId}`);
  const [category] = await pool.query(
    `SELECT name, counting FROM category WHERE id=${categoryId}`
  );
  const title = category[0].name;
  const counting = category[0].counting;
  let [categoryPost] = await pool.query(
    `SELECT category_post.id, title, users.displayName, email, good, comment, count, date_format(created, '%y.%m.%d %H:%i') as created FROM category_post JOIN users ON user_id=users.id WHERE category_id=${categoryId} ORDER BY category_post.id DESC LIMIT 50 OFFSET ${offset}`
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
    `SELECT title, content, users.displayName, email, good, bad, comment, count, date_format(created, '%y.%m.%d %H:%i') as created FROM category_post JOIN users ON user_id=users.id WHERE category_id=${categoryId} AND category_post.id=${postId}`
  );
  const [commentList] = await pool.query(
    `SELECT category_post_comment.id, user_id, users.displayName, email, content, date_format(created, '%y.%m.%d %H:%i') as created FROM category_post_comment JOIN users ON user_id=users.id WHERE post_id=${postId}`
  );
  // UPDATE category_post SET good=good+1 WHERE id=${postId}
  res.json({ title, counting, categoryPost, post, commentList });
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
  console.log(nowSql);
  if (modeType === "recommend") {
    [categoryPost] = await pool.query(
      `SELECT category_post.id, title, users.displayName, email, good, comment, count, date_format(created, '%y.%m.%d %H:%i') as created FROM category_post JOIN users ON user_id=users.id WHERE category_id=${categoryId} AND created LIKE '${nowSql}%' AND good>0 ORDER BY good DESC LIMIT 50`
    );
    const [[cot]] = await pool.query(
      `SELECT count(*) as counting FROM category_post WHERE category_id=${categoryId} AND created LIKE '${nowSql}%' AND good>0`
    );
    counting = cot.counting;
  } else if (modeType === "notice") {
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
      `SELECT category_post.id, title, users.displayName, email, good, comment, count, date_format(created, '%y.%m.%d %H:%i') as created FROM category_post JOIN users ON user_id=users.id WHERE category_id=${categoryId} AND created LIKE '${nowSql}%' AND good>0 ORDER BY good DESC LIMIT 50 OFFSET ${offset}`
    );
    const [[cot]] = await pool.query(
      `SELECT count(*) as counting FROM category_post WHERE category_id=${categoryId} AND created LIKE '${nowSql}%' AND good>0`
    );
    counting = cot.counting;
  } else if (modeType === "notice") {
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

router.get(
  "/:categoryId/mode/:modeType/page/:pageId/:postId",
  async (req, res) => {
    const categoryId = path.parse(req.params.categoryId).base;
    const modeType = path.parse(req.params.modeType).base;
    const pageId = path.parse(req.params.pageId).base;
    const offset = 50 * (pageId - 1);
    const postId = path.parse(req.params.postId).base;
    await pool.query(
      `UPDATE category_post SET count=count+1 WHERE id=${postId}`
    );
    const [[category]] = await pool.query(
      `SELECT name FROM category WHERE id=${categoryId}`
    );
    const title = category.name;
    let counting, categoryPost, post, commentList;
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
        `SELECT category_post.id, title, users.displayName, email, good, comment, count, date_format(created, '%y.%m.%d %H:%i') as created FROM category_post JOIN users ON user_id=users.id WHERE category_id=${categoryId} AND created LIKE '${nowSql}%' AND good>0 ORDER BY good DESC LIMIT 50 OFFSET ${offset}`
      );
      const [[cot]] = await pool.query(
        `SELECT count(*) as counting FROM category_post WHERE category_id=${categoryId} AND created LIKE '${nowSql}%' AND good>0`
      );
      counting = cot.counting;
      [[post]] = await pool.query(
        `SELECT title, content, users.displayName, email, good, bad, comment, count, date_format(created, '%y.%m.%d %H:%i') as created FROM category_post JOIN users ON user_id=users.id WHERE category_id=${categoryId} AND category_post.id=${postId}`
      );
      [commentList] = await pool.query(
        `SELECT category_post_comment.id, user_id, users.displayName, email, content, date_format(created, '%y.%m.%d %H:%i') as created FROM category_post_comment JOIN users ON user_id=users.id WHERE post_id=${postId}`
      );
    } else if (modeType === "notice") {
    }
    yy = yy.substring(2);
    const now = `${yy}.${mm}.${dd}`;
    categoryPost.map((post) =>
      post.created.substring(0, 8) === now
        ? (post.created = post.created.substring(9))
        : (post.created = post.created.substring(0, 8))
    );

    res.json({ title, counting, categoryPost, post, commentList });
  }
);

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////search
router.get(
  "/:categoryId/search/:searchType/Keyword/:Keyword",
  async (req, res) => {
    const categoryId = path.parse(req.params.categoryId).base;
    const searchType = path.parse(req.params.searchType).base;
    const Keyword = path.parse(req.params.Keyword).base;
    const [category] = await pool.query(
      `SELECT name FROM category WHERE id=${categoryId}`
    );
    const title = category[0].name;
    let categoryPost, counting, cot;
    switch (searchType) {
      case "all":
        [categoryPost] = await pool.query(
          `SELECT category_post.id, title, users.displayName, email, good, comment, count, date_format(created, '%y.%m.%d %H:%i') as created FROM category_post JOIN users ON user_id=users.id WHERE category_id=${categoryId} AND (title LIKE '%${Keyword}%' OR content LIKE '%${Keyword}%' OR users.displayName='${Keyword}') ORDER BY category_post.id DESC LIMIT 50`
        );
        [[cot]] = await pool.query(
          `SELECT count(*) as counting FROM category_post JOIN users ON user_id=users.id WHERE category_id=${categoryId} AND (title LIKE '%${Keyword}%' OR content LIKE '%${Keyword}%' OR users.displayName='${Keyword}')`
        );
        counting = cot.counting;
        break;
      case "title":
        [categoryPost] = await pool.query(
          `SELECT category_post.id, title, users.displayName, email, good, comment, count, date_format(created, '%y.%m.%d %H:%i') as created FROM category_post JOIN users ON user_id=users.id WHERE category_id=${categoryId} AND title LIKE '%${Keyword}%' ORDER BY category_post.id DESC LIMIT 50`
        );
        [[cot]] = await pool.query(
          `SELECT count(*) as counting FROM category_post JOIN users ON user_id=users.id WHERE category_id=${categoryId} AND title LIKE '%${Keyword}%'`
        );
        counting = cot.counting;
        break;
      case "content":
        [categoryPost] = await pool.query(
          `SELECT category_post.id, title, users.displayName, email, good, comment, count, date_format(created, '%y.%m.%d %H:%i') as created FROM category_post JOIN users ON user_id=users.id WHERE category_id=${categoryId} AND content LIKE '%${Keyword}%' ORDER BY category_post.id DESC LIMIT 50`
        );
        [[cot]] = await pool.query(
          `SELECT count(*) as counting FROM category_post JOIN users ON user_id=users.id WHERE category_id=${categoryId} AND content LIKE '%${Keyword}%'`
        );
        counting = cot.counting;
        break;
      case "displayName":
        [categoryPost] = await pool.query(
          `SELECT category_post.id, title, users.displayName, email, good, comment, count, date_format(created, '%y.%m.%d %H:%i') as created FROM category_post JOIN users ON user_id=users.id WHERE category_id=${categoryId} AND users.displayName='${Keyword}' ORDER BY category_post.id DESC LIMIT 50`
        );
        [[cot]] = await pool.query(
          `SELECT count(*) as counting FROM category_post JOIN users ON user_id=users.id WHERE category_id=${categoryId} AND users.displayName='${Keyword}'`
        );
        counting = cot.counting;
        break;
      case "title+content":
        [categoryPost] = await pool.query(
          `SELECT category_post.id, title, users.displayName, email, good, comment, count, date_format(created, '%y.%m.%d %H:%i') as created FROM category_post JOIN users ON user_id=users.id WHERE category_id=${categoryId} AND (title LIKE '%${Keyword}%' OR content LIKE '%${Keyword}%') ORDER BY category_post.id DESC LIMIT 50`
        );
        [[cot]] = await pool.query(
          `SELECT count(*) as counting FROM category_post JOIN users ON user_id=users.id WHERE category_id=${categoryId} AND (title LIKE '%${Keyword}%' OR content LIKE '%${Keyword}%')`
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
    categoryPost.map((post) =>
      post.created.substring(0, 8) === now
        ? (post.created = post.created.substring(9))
        : (post.created = post.created.substring(0, 8))
    );
    res.json({ title, counting, categoryPost });
  }
);

router.get(
  "/:categoryId/search/:searchType/Keyword/:Keyword/page/:pageId",
  async (req, res) => {
    const categoryId = path.parse(req.params.categoryId).base;
    const searchType = path.parse(req.params.searchType).base;
    const Keyword = path.parse(req.params.Keyword).base;
    const pageId = path.parse(req.params.pageId).base;
    const offset = 50 * (pageId - 1);
    const [category] = await pool.query(
      `SELECT name FROM category WHERE id=${categoryId}`
    );
    const title = category[0].name;
    let categoryPost, counting, cot;
    switch (searchType) {
      case "all":
        [categoryPost] = await pool.query(
          `SELECT category_post.id, title, users.displayName, email, good, comment, count, date_format(created, '%y.%m.%d %H:%i') as created FROM category_post JOIN users ON user_id=users.id WHERE category_id=${categoryId} AND (title LIKE '%${Keyword}%' OR content LIKE '%${Keyword}%' OR users.displayName='${Keyword}') ORDER BY category_post.id DESC LIMIT 50 OFFSET ${offset}`
        );
        [[cot]] = await pool.query(
          `SELECT count(*) as counting FROM category_post JOIN users ON user_id=users.id WHERE category_id=${categoryId} AND (title LIKE '%${Keyword}%' OR content LIKE '%${Keyword}%' OR users.displayName='${Keyword}')`
        );
        counting = cot.counting;
        break;
      case "title":
        [categoryPost] = await pool.query(
          `SELECT category_post.id, title, users.displayName, email, good, comment, count, date_format(created, '%y.%m.%d %H:%i') as created FROM category_post JOIN users ON user_id=users.id WHERE category_id=${categoryId} AND title LIKE '%${Keyword}%' ORDER BY category_post.id DESC LIMIT 50 OFFSET ${offset}`
        );
        [[cot]] = await pool.query(
          `SELECT count(*) as counting FROM category_post JOIN users ON user_id=users.id WHERE category_id=${categoryId} AND title LIKE '%${Keyword}%'`
        );
        counting = cot.counting;
        break;
      case "content":
        [categoryPost] = await pool.query(
          `SELECT category_post.id, title, users.displayName, email, good, comment, count, date_format(created, '%y.%m.%d %H:%i') as created FROM category_post JOIN users ON user_id=users.id WHERE category_id=${categoryId} AND content LIKE '%${Keyword}%' ORDER BY category_post.id DESC LIMIT 50 OFFSET ${offset}`
        );
        [[cot]] = await pool.query(
          `SELECT count(*) as counting FROM category_post JOIN users ON user_id=users.id WHERE category_id=${categoryId} AND content LIKE '%${Keyword}%'`
        );
        counting = cot.counting;
        break;
      case "displayName":
        [categoryPost] = await pool.query(
          `SELECT category_post.id, title, users.displayName, email, good, comment, count, date_format(created, '%y.%m.%d %H:%i') as created FROM category_post JOIN users ON user_id=users.id WHERE category_id=${categoryId} AND users.displayName='${Keyword}' ORDER BY category_post.id DESC LIMIT 50 OFFSET ${offset}`
        );
        [[cot]] = await pool.query(
          `SELECT count(*) as counting FROM category_post JOIN users ON user_id=users.id WHERE category_id=${categoryId} AND users.displayName='${Keyword}'`
        );
        counting = cot.counting;
        break;
      case "title+content":
        [categoryPost] = await pool.query(
          `SELECT category_post.id, title, users.displayName, email, good, comment, count, date_format(created, '%y.%m.%d %H:%i') as created FROM category_post JOIN users ON user_id=users.id WHERE category_id=${categoryId} AND (title LIKE '%${Keyword}%' OR content LIKE '%${Keyword}%') ORDER BY category_post.id DESC LIMIT 50 OFFSET ${offset}`
        );
        [[cot]] = await pool.query(
          `SELECT count(*) as counting FROM category_post JOIN users ON user_id=users.id WHERE category_id=${categoryId} AND (title LIKE '%${Keyword}%' OR content LIKE '%${Keyword}%')`
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
    categoryPost.map((post) =>
      post.created.substring(0, 8) === now
        ? (post.created = post.created.substring(9))
        : (post.created = post.created.substring(0, 8))
    );
    res.json({ title, counting, categoryPost });
  }
);

router.get(
  "/:categoryId/search/:searchType/Keyword/:Keyword/page/:pageId/:postId",
  async (req, res) => {
    const categoryId = path.parse(req.params.categoryId).base;
    const searchType = path.parse(req.params.searchType).base;
    const Keyword = path.parse(req.params.Keyword).base;
    const pageId = path.parse(req.params.pageId).base;
    const offset = 50 * (pageId - 1);
    const postId = path.parse(req.params.postId).base;
    await pool.query(
      `UPDATE category_post SET count=count+1 WHERE id=${postId}`
    );
    const [category] = await pool.query(
      `SELECT name FROM category WHERE id=${categoryId}`
    );
    const title = category[0].name;
    let categoryPost, counting, cot;
    switch (searchType) {
      case "all":
        [categoryPost] = await pool.query(
          `SELECT category_post.id, title, users.displayName, email, good, comment, count, date_format(created, '%y.%m.%d %H:%i') as created FROM category_post JOIN users ON user_id=users.id WHERE category_id=${categoryId} AND (title LIKE '%${Keyword}%' OR content LIKE '%${Keyword}%' OR users.displayName='${Keyword}') ORDER BY category_post.id DESC LIMIT 50 OFFSET ${offset}`
        );
        [[cot]] = await pool.query(
          `SELECT count(*) as counting FROM category_post JOIN users ON user_id=users.id WHERE category_id=${categoryId} AND (title LIKE '%${Keyword}%' OR content LIKE '%${Keyword}%' OR users.displayName='${Keyword}')`
        );
        counting = cot.counting;
        break;
      case "title":
        [categoryPost] = await pool.query(
          `SELECT category_post.id, title, users.displayName, email, good, comment, count, date_format(created, '%y.%m.%d %H:%i') as created FROM category_post JOIN users ON user_id=users.id WHERE category_id=${categoryId} AND title LIKE '%${Keyword}%' ORDER BY category_post.id DESC LIMIT 50 OFFSET ${offset}`
        );
        [[cot]] = await pool.query(
          `SELECT count(*) as counting FROM category_post JOIN users ON user_id=users.id WHERE category_id=${categoryId} AND title LIKE '%${Keyword}%'`
        );
        counting = cot.counting;
        break;
      case "content":
        [categoryPost] = await pool.query(
          `SELECT category_post.id, title, users.displayName, email, good, comment, count, date_format(created, '%y.%m.%d %H:%i') as created FROM category_post JOIN users ON user_id=users.id WHERE category_id=${categoryId} AND content LIKE '%${Keyword}%' ORDER BY category_post.id DESC LIMIT 50 OFFSET ${offset}`
        );
        [[cot]] = await pool.query(
          `SELECT count(*) as counting FROM category_post JOIN users ON user_id=users.id WHERE category_id=${categoryId} AND content LIKE '%${Keyword}%'`
        );
        counting = cot.counting;
        break;
      case "displayName":
        [categoryPost] = await pool.query(
          `SELECT category_post.id, title, users.displayName, email, good, comment, count, date_format(created, '%y.%m.%d %H:%i') as created FROM category_post JOIN users ON user_id=users.id WHERE category_id=${categoryId} AND users.displayName='${Keyword}' ORDER BY category_post.id DESC LIMIT 50 OFFSET ${offset}`
        );
        [[cot]] = await pool.query(
          `SELECT count(*) as counting FROM category_post JOIN users ON user_id=users.id WHERE category_id=${categoryId} AND users.displayName='${Keyword}'`
        );
        counting = cot.counting;
        break;
      case "title+content":
        [categoryPost] = await pool.query(
          `SELECT category_post.id, title, users.displayName, email, good, comment, count, date_format(created, '%y.%m.%d %H:%i') as created FROM category_post JOIN users ON user_id=users.id WHERE category_id=${categoryId} AND (title LIKE '%${Keyword}%' OR content LIKE '%${Keyword}%') ORDER BY category_post.id DESC LIMIT 50 OFFSET ${offset}`
        );
        [[cot]] = await pool.query(
          `SELECT count(*) as counting FROM category_post JOIN users ON user_id=users.id WHERE category_id=${categoryId} AND (title LIKE '%${Keyword}%' OR content LIKE '%${Keyword}%')`
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
    categoryPost.map((post) =>
      post.created.substring(0, 8) === now
        ? (post.created = post.created.substring(9))
        : (post.created = post.created.substring(0, 8))
    );
    const [[post]] = await pool.query(
      `SELECT title, content, users.displayName, email, good, bad, comment, count, date_format(created, '%y.%m.%d %H:%i') as created FROM category_post JOIN users ON user_id=users.id WHERE category_id=${categoryId} AND category_post.id=${postId}`
    );
    const [commentList] = await pool.query(
      `SELECT category_post_comment.id, user_id, users.displayName, email, content, date_format(created, '%y.%m.%d %H:%i') as created FROM category_post_comment JOIN users ON user_id=users.id WHERE post_id=${postId}`
    );
    res.json({ title, counting, categoryPost, post, commentList });
  }
);

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
  await pool.query(
    `UPDATE category SET counting=counting+1 WHERE id=${categoryId}`
  );
  res.json({ process: true });
});

router.post("/comment/refresh", async (req, res) => {
  const postId = req.body.postId;
  const [commentList] = await pool.query(
    `SELECT category_post_comment.id, user_id, users.displayName, email, content, date_format(created, '%y.%m.%d %H:%i') as created FROM category_post_comment JOIN users ON user_id=users.id WHERE post_id=${postId}`
  );
  res.json({ commentList });
});

router.post("/comment/create_process", async (req, res) => {
  const post_id = req.body.postId;
  const user_id = req.body.user_id;
  const content = req.body.comment;
  await pool.query(
    `INSERT INTO category_post_comment(post_id, user_id, content) VALUES('${post_id}','${user_id}','${content}')`
  );
  await pool.query(
    `UPDATE category_post SET comment=comment+1 WHERE id=${post_id}`
  );
  res.json({ process: true });
});

router.post("/comment/delete_process", async (req, res) => {
  const id = req.body.id;
  const post_id = req.body.post_id;
  await pool.query(`DELETE FROM category_post_comment WHERE id=${id}`);
  await pool.query(
    `UPDATE category_post SET comment=comment-1 WHERE id=${post_id}`
  );
  res.json({ process: true });
});

router.post("/good/process", async (req, res) => {
  const user_id = req.body.user_id;
  const postId = req.body.postId;
  const [good] = await pool.query(
    `SELECT user_id FROM category_post_good WHERE post_id='${postId}'`
  );
  console.log(good);
  if (good.findIndex((obj) => obj.user_id == user_id) === -1) {
    await pool.query(
      `INSERT INTO category_post_good(post_id, user_id) VALUES('${postId}','${user_id}')`
    );
    await pool.query(`UPDATE category_post SET good=good+1 WHERE id=${postId}`);
    res.json("추천이 완료되었습니다.");
  } else {
    await pool.query(
      `DELETE FROM category_post_good WHERE user_id='${user_id}'`
    );
    await pool.query(`UPDATE category_post SET good=good-1 WHERE id=${postId}`);
    res.json("추천이 취소되었습니다.");
  }
});

router.post("/bad/process", async (req, res) => {
  const user_id = req.body.user_id;
  const postId = req.body.postId;
  const [bad] = await pool.query(
    `SELECT user_id FROM category_post_bad WHERE post_id='${postId}'`
  );
  if (bad.findIndex((obj) => obj.user_id == user_id) === -1) {
    await pool.query(
      `INSERT INTO category_post_bad(post_id, user_id) VALUES('${postId}','${user_id}')`
    );
    await pool.query(`UPDATE category_post SET bad=bad+1 WHERE id=${postId}`);
    res.json("추천이 완료되었습니다.");
  } else {
    await pool.query(
      `DELETE FROM category_post_bad WHERE user_id='${user_id}'`
    );
    await pool.query(`UPDATE category_post SET bad=bad-1 WHERE id=${postId}`);
    res.json("추천이 취소되었습니다.");
  }
});

router.post("/goodbad/refresh", async (req, res) => {
  const postId = req.body.postId;
  const [[post]] = await pool.query(
    `SELECT good, bad FROM category_post WHERE category_post.id=${postId}`
  );
  res.json({ post });
});

router.get("/info/:email", async (req, res) => {
  const email = path.parse(req.params.email).base;
  const [[categoryPost]] = await pool.query(
    `SELECT count(*) as count FROM users JOIN category_post ON users.id=user_id WHERE email='${email}'`
  );
  const [[categoryComment]] = await pool.query(
    `SELECT count(*) as count FROM users JOIN category_post_comment ON users.id=user_id WHERE email='${email}'`
  );
  res.json({ post: categoryPost.count, comment: categoryComment.count });
});

module.exports = router;
