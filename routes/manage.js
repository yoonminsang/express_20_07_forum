const express = require("express");
const router = express.Router();
const pool = require("../lib/pool");
const path = require("path");
// const { resolveSoa } = require("dns"); ??이거뭐야 나 안만들어써

router.get("/category", async (req, res) => {
  const [category] = await pool.query(
    "SELECT category.id, category.name as category_name, subject as subject_id, subject.name as subject_name, counting FROM category JOIN subject ON category.subject=subject.id ORDER BY subject, category.name"
  );
  const [subject] = await pool.query("SELECT * FROM subject");
  res.json({ category, subject });
});

router.post("/category/process", async (req, res) => {
  const items = req.body.items;
  const deleteId = req.body.filtered_deleteItems;
  const modifyId = req.body.filtered_modifyItems;

  for (let i = 0; i < deleteId.length; i++) {
    await pool.query("DELETE FROM category WHERE id =?", [deleteId[i]]);
    await pool.query("DELETE FROM category_post WHERE category_id=?", [
      deleteId[i],
    ]);
  }

  let modifyIndex;
  for (let i = 0; i < modifyId.length; i++) {
    modifyIndex = items.findIndex((index) => index.id === modifyId[i]);
    await pool.query("UPDATE category SET name=?, subject=? WHERE id=?", [
      items[modifyIndex].category_name,
      items[modifyIndex].subject_id,
      items[modifyIndex].id,
    ]);
  }

  let ind = items.findIndex((index) => index.id === 0);
  if (ind !== -1) {
    for (ind; ind < items.length; ind++) {
      await pool.query("INSERT INTO category(name, subject) VALUES(?,?)", [
        items[ind].category_name,
        items[ind].subject_id,
      ]);
    }
  }
  res.json({ process: true });
});

router.get("/notice", async (req, res) => {
  let [notice_post] = await pool.query(
    "SELECT id, title, status, comment, date_format(modified, '%Y-%m-%d %h:%i') as created FROM notice_post ORDER BY id DESC LIMIT 15"
  );
  notice_post.map((post) => (post.checked = false));
  const [[notice_counting]] = await pool.query(
    "SELECT counting FROM notice_counting"
  );
  res.json({ notice_post, notice_counting: notice_counting.counting });
});

router.get("/notice/page/:pageId", async (req, res) => {
  const pageId = path.parse(req.params.pageId).base;
  const offset = 15 * (pageId - 1);
  let [
    notice_post,
  ] = await pool.query(
    "SELECT id, title, status, comment, date_format(modified, '%Y-%m-%d %h:%i') as created FROM notice_post ORDER BY id DESC LIMIT 15 OFFSET ?",
    [offset]
  );
  notice_post.map((post) => (post.checked = false));
  const [[notice_counting]] = await pool.query(
    "SELECT counting FROM notice_counting"
  );
  res.json({ notice_post, notice_counting });
});

router.get("/notice/:status", async (req, res) => {
  const status = path.parse(req.params.status).base;
  let [notice_post] = await pool.query(
    `SELECT id, title, status, comment, date_format(modified, '%Y-%m-%d %h:%i') as created FROM notice_post WHERE status='${status}' ORDER BY id DESC LIMIT 15`
  );
  notice_post.map((post) => (post.checked = false));
  const [[notice_counting]] = await pool.query(
    `SELECT count(*) as counting FROM notice_post WHERE status='${status}'`
  );
  res.json({ notice_post, notice_counting });
});

router.get("/notice/:status/page/:pageId", async (req, res) => {
  const status = path.parse(req.params.status).base;
  const pageId = path.parse(req.params.pageId).base;
  const offset = 15 * (pageId - 1);
  let [notice_post] = await pool.query(
    `SELECT id, title, status, comment, date_format(modified, '%Y-%m-%d %h:%i') as created FROM notice_post WHERE status='${status}' ORDER BY id DESC LIMIT 15 OFFSET ${offset}`
  );
  notice_post.map((post) => (post.checked = false));
  const [[notice_counting]] = await pool.query(
    `SELECT count(*) as counting FROM notice_post WHERE status='${status}'`
  );
  res.json({ notice_post, notice_counting });
});

router.get("/notice/search/type/:type/Keyword/:Keyword", async (req, res) => {
  const type = path.parse(req.params.type).base;
  const Keyword = path.parse(req.params.Keyword).base;
  let [notice_post] = await pool.query(
    `SELECT id, title, status, comment, date_format(modified, '%Y-%m-%d %h:%i') as created FROM notice_post WHERE ${type} LIKE '%${Keyword}%' ORDER BY id DESC LIMIT 15`
  );
  notice_post.map((post) => (post.checked = false));

  const [[notice_counting]] = await pool.query(
    `SELECT COUNT(*) as counting FROM notice_post WHERE ${type} LIKE '%${Keyword}%'`
  );
  res.json({ notice_post, notice_counting });
});

router.get(
  "/notice/search/type/:type/Keyword/:Keyword/page/:pageId",
  async (req, res) => {
    const pageId = path.parse(req.params.pageId).base;
    const offset = 15 * (pageId - 1);
    const type = path.parse(req.params.type).base;
    const Keyword = path.parse(req.params.Keyword).base;
    let [notice_post] = await pool.query(
      `SELECT id, title, status, comment, date_format(modified, '%Y-%m-%d %h:%i') as created FROM notice_post WHERE ${type} LIKE '%${Keyword}%' ORDER BY id DESC LIMIT 15 OFFSET ${offset}`
    );
    notice_post.map((post) => (post.checked = false));

    const [[notice_counting]] = await pool.query(
      `SELECT COUNT(*) as counting FROM notice_post WHERE ${type} LIKE '%${Keyword}%'`
    );
    res.json({ notice_post, notice_counting });
  }
);

router.post("/notice/delete_process", async (req, res) => {
  const id = req.body.id;
  await pool.query("DELETE FROM notice_post WHERE id=?", [id]);
  await pool.query("DELETE FROM notice_comment WHERE notice_id =?", [id]);
  await pool.query("DELETE FROM notice_good WHERE notice_id =?", [id]);
  await pool.query("DELETE FROM notice_bad WHERE notice_id =?", [id]);
  await pool.query("UPDATE notice_counting SET counting = counting - 1");
  res.json({ process: true });
});

router.post("/notice/status_process", async (req, res) => {
  const id = req.body.id;
  const status = req.body.status;
  await pool.query("UPDATE notice_post SET status=? WHERE id=?", [status, id]);
  res.json({ process: true });
});

router.post("/notice/select_delete_process", async (req, res) => {
  const selectId = req.body.selectId;
  const id = selectId.join();
  await pool.query(`DELETE FROM notice_post WHERE id IN (${id})`);
  await pool.query("UPDATE notice_counting SET counting = counting - ?", [
    selectId.length,
  ]);
  res.json({ process: true });
});

router.post("/notice/select_status_process", async (req, res) => {
  const id = req.body.id;
  const status = req.body.status;
  await pool.query(
    `UPDATE notice_post SET status='${status}' WHERE id IN (${id})`
  );
  res.json({ process: true });
});

router.post("/notice/create_process", async (req, res) => {
  const title = req.body.title;
  const content = req.body.content;
  const status = req.body.status;
  await pool.query(
    `INSERT INTO notice_post(title, content, status) VALUES('${title}','${content}','${status}')`
  );
  await pool.query(`UPDATE notice_counting SET counting=counting+1`);
  res.json({ process: true });
});

router.get("/notice/modify/:postId", async (req, res) => {
  if (req.user.grade !== "manager") {
    return res.json(false);
  }
  const postId = path.parse(req.params.postId).base;
  const [[notice]] = await pool.query(
    `SELECT title, content, status FROM notice_post WHERE id=${postId}`
  );
  res.json({ notice });
});

router.post("/notice/modify_process", async (req, res) => {
  const postId = req.body.postId;
  const title = req.body.title;
  const content = req.body.content;
  const status = req.body.status;
  await pool.query(
    `UPDATE notice_post SET title='${title}', content='${content}', status='${status}' WHERE id=${postId}`
  );
  res.json({ process: true });
});

router.get("/hit", async (req, res) => {
  let [category_post] = await pool.query(
    "SELECT category_post.id, title, comment, good, hit, hit_status, report, date_format(modified, '%Y-%m-%d %h:%i') as created, category_id, users.displayName, category.name FROM category_post JOIN users ON user_id=users.id JOIN category ON category_id=category.id WHERE hit>0 AND (hit_status='NULL' OR hit_status='off') ORDER BY hit DESC LIMIT 15"
  );
  category_post.map((post) => (post.checked = false));
  const [[counting]] = await pool.query(
    "SELECT count(*) as counting FROM category_post WHERE hit>0 AND (hit_status='NULL' OR hit_status='off')"
  );
  res.json({ category_post, counting: counting.counting });
});

router.get("/hit/page/:pageId", async (req, res) => {
  const pageId = path.parse(req.params.pageId).base;
  const offset = 15 * (pageId - 1);
  let [
    category_post,
  ] = await pool.query(
    "SELECT category_post.id, title, comment, good, hit, hit_status, report, date_format(modified, '%Y-%m-%d %h:%i') as created, category_id, users.displayName, category.name FROM category_post JOIN users ON user_id=users.id JOIN category ON category_id=category.id WHERE hit>0 AND (hit_status='NULL' OR hit_status='off') ORDER BY hit DESC LIMIT 15 OFFSET ?",
    [offset]
  );
  category_post.map((post) => (post.checked = false));
  const [[counting]] = await pool.query(
    "SELECT count(*) as counting FROM category_post WHERE hit>0 AND (hit_status='NULL' OR hit_status='off')"
  );
  res.json({ category_post, counting: counting.counting });
});

router.get("/hit/:status", async (req, res) => {
  const status = path.parse(req.params.status).base;
  let [category_post] = await pool.query(
    `SELECT category_post.id, title, comment, good, hit, hit_status, report, date_format(modified, '%Y-%m-%d %h:%i') as created, category_id, users.displayName, category.name  FROM category_post JOIN users ON user_id=users.id JOIN category ON category_id=category.id WHERE hit>0 AND hit_status='${status}' ORDER BY hit DESC LIMIT 15`
  );
  category_post.map((post) => (post.checked = false));
  const [[counting]] = await pool.query(
    `SELECT count(*) as counting FROM category_post WHERE hit>0 AND hit_status='${status}'`
  );
  res.json({ category_post, counting: counting.counting });
});

router.get("/hit/:status/page/:pageId", async (req, res) => {
  const status = path.parse(req.params.status).base;
  const pageId = path.parse(req.params.pageId).base;
  const offset = 15 * (pageId - 1);
  let [
    category_post,
  ] = await pool.query(
    `SELECT category_post.id, title, comment, good, hit, hit_status, report, date_format(modified, '%Y-%m-%d %h:%i') as created, category_id, users.displayName, category.name FROM category_post JOIN users ON user_id=users.id JOIN category ON category_id=category.id WHERE hit>0 AND hit_status='${status}' ORDER BY hit DESC LIMIT 15 OFFSET ?`,
    [offset]
  );
  category_post.map((post) => (post.checked = false));
  const [[counting]] = await pool.query(
    `SELECT count(*) as counting FROM category_post WHERE hit>0 AND hit_status='${status}'`
  );
  res.json({ category_post, counting: counting.counting });
});

router.get("/hit/search/type/:type/Keyword/:Keyword", async (req, res) => {
  const type = path.parse(req.params.type).base;
  const Keyword = path.parse(req.params.Keyword).base;
  let [category_post] = await pool.query(
    `SELECT category_post.id, title, comment, good, hit, hit_status, date_format(modified, '%Y-%m-%d %h:%i') as created, category_id, users.displayName, category.name FROM category_post JOIN users ON user_id=users.id JOIN category ON category_id=category.id WHERE hit>0 AND (hit_status='NULL' OR hit_status='off') AND ${type} LIKE '%${Keyword}%' ORDER BY id DESC LIMIT 15`
  );
  category_post.map((post) => (post.checked = false));
  const [[counting]] = await pool.query(
    `SELECT COUNT(*) as counting FROM category_post WHERE hit>0 AND (hit_status='NULL' OR hit_status='off') AND ${type} LIKE '%${Keyword}%'`
  );
  res.json({ category_post, counting: counting.counting });
});

router.get(
  "/hit/search/type/:type/Keyword/:Keyword/page/:pageId",
  async (req, res) => {
    const pageId = path.parse(req.params.pageId).base;
    const offset = 15 * (pageId - 1);
    const type = path.parse(req.params.type).base;
    const Keyword = path.parse(req.params.Keyword).base;
    let [category_post] = await pool.query(
      `SELECT category_post.id, title, comment, good, hit, hit_status, date_format(modified, '%Y-%m-%d %h:%i') as created, category_id, users.displayName, category.name FROM category_post JOIN users ON user_id=users.id JOIN category ON category_id=category.id WHERE hit>0 AND (hit_status='NULL' OR hit_status='off') AND ${type} LIKE '%${Keyword}%' ORDER BY id DESC LIMIT 15 OFFSET ${offset}`
    );
    category_post.map((post) => (post.checked = false));

    const [[counting]] = await pool.query(
      `SELECT COUNT(*) as counting FROM category_post WHERE hit>0 AND (hit_status='NULL' OR hit_status='off') AND ${type} LIKE '%${Keyword}%'`
    );
    res.json({ category_post, counting: counting.counting });
  }
);

router.post("/hit/select_process", async (req, res) => {
  const id = req.body.id;
  const status = req.body.status;
  await pool.query(
    `UPDATE category_post SET hit_status='${status}' WHERE id IN (${id})`
  );
  if (status === "on") {
    await pool.query(
      `INSERT INTO hit_post(category_id, origin_post_id, user_id, title, content) SELECT category_id, id, user_id, title, content FROM category_post WHERE id IN (${id})`
    );
  }
  res.json({ process: true });
});

router.get("/post", async (req, res) => {
  let [category_post] = await pool.query(
    "SELECT category_post.id, title, comment, good, bad, hit, report, date_format(modified, '%Y-%m-%d %h:%i') as created, category_id, users.displayName, category.name FROM category_post JOIN users ON user_id=users.id JOIN category ON category_id=category.id ORDER BY id DESC LIMIT 15"
  );
  category_post.map((post) => (post.checked = false));
  const [[counting]] = await pool.query(
    `select sum(counting) as counting from category`
  );
  const [subject] = await pool.query("SELECT * FROM subject");
  const [category] = await pool.query(
    "SELECT id, name, subject, counting FROM category"
  );
  let subject_category = [];
  for (let i = 1; i <= subject.length; i++) {
    subject_category.push(category.filter((cate) => cate.subject === i));
  }
  res.json({
    category_post,
    counting: counting.counting,
    subject,
    subject_category,
  });
});

router.get("/post/page/:pageId", async (req, res) => {
  const pageId = path.parse(req.params.pageId).base;
  const offset = 15 * (pageId - 1);
  let [category_post] = await pool.query(
    `SELECT category_post.id, title, comment, good, bad, hit, report, date_format(modified, '%Y-%m-%d %h:%i') as created, category_id, users.displayName, category.name FROM category_post JOIN users ON user_id=users.id JOIN category ON category_id=category.id ORDER BY id DESC LIMIT 15 OFFSET ${offset}`
  );
  category_post.map((post) => (post.checked = false));
  // const [[counting]] = await pool.query(
  //   "SELECT count(*) as counting FROM category_post"
  // );
  const [[counting]] = await pool.query(
    `select sum(counting) as counting from category`
  );
  const [subject] = await pool.query("SELECT * FROM subject");
  const [category] = await pool.query(
    "SELECT id, name, subject, counting FROM category"
  );
  let subject_category = [];
  for (let i = 1; i <= subject.length; i++) {
    subject_category.push(category.filter((cate) => cate.subject === i));
  }
  res.json({
    category_post,
    counting: counting.counting,
    subject,
    subject_category,
  });
});

router.get("/post/category/:category", async (req, res) => {
  const category = path.parse(req.params.category).base;
  let [category_post] = await pool.query(
    `SELECT category_post.id, title, comment, good, bad, hit, report, date_format(modified, '%Y-%m-%d %h:%i') as created, category_id, users.displayName, category.name FROM category_post JOIN users ON user_id=users.id JOIN category ON category_id=category.id WHERE category_id=${category} ORDER BY id DESC LIMIT 15`
  );
  category_post.map((post) => (post.checked = false));
  const [[counting]] = await pool.query(
    `select counting from category where id=${category}`
  );
  const [subject] = await pool.query("SELECT * FROM subject");
  const [category2] = await pool.query(
    "SELECT id, name, subject, counting FROM category"
  );
  let subject_category = [];
  for (let i = 1; i <= subject.length; i++) {
    subject_category.push(category2.filter((cate) => cate.subject === i));
  }
  res.json({
    category_post,
    counting: counting.counting,
    subject,
    subject_category,
  });
});

router.get("/post/search/type/:type/Keyword/:Keyword", async (req, res) => {
  const type = path.parse(req.params.type).base;
  const Keyword = path.parse(req.params.Keyword).base;
  let [category_post] = await pool.query(
    `SELECT category_post.id, title, comment, good, hit, hit_status, date_format(modified, '%Y-%m-%d %h:%i') as created, category_id, users.displayName, category.name FROM category_post JOIN users ON user_id=users.id JOIN category ON category_id=category.id WHERE ${type} LIKE '%${Keyword}%' ORDER BY id DESC LIMIT 15`
  );
  category_post.map((post) => (post.checked = false));

  const [[counting]] = await pool.query(
    `SELECT COUNT(*) as counting FROM category_post WHERE ${type} LIKE '%${Keyword}%'`
  );
  const [subject] = await pool.query("SELECT * FROM subject");
  const [category] = await pool.query(
    "SELECT id, name, subject, counting FROM category"
  );
  let subject_category = [];
  for (let i = 1; i <= subject.length; i++) {
    subject_category.push(category.filter((cate) => cate.subject === i));
  }
  res.json({
    category_post,
    counting: counting.counting,
    subject,
    subject_category,
  });
});

router.get(
  "/post/search/type/:type/Keyword/:Keyword/page/:pageId",
  async (req, res) => {
    const type = path.parse(req.params.type).base;
    const Keyword = path.parse(req.params.Keyword).base;
    const pageId = path.parse(req.params.pageId).base;
    const offset = 15 * (pageId - 1);
    let [category_post] = await pool.query(
      `SELECT category_post.id, title, comment, good, hit, hit_status, date_format(modified, '%Y-%m-%d %h:%i') as created, category_id, users.displayName, category.name FROM category_post JOIN users ON user_id=users.id JOIN category ON category_id=category.id WHERE ${type} LIKE '%${Keyword}%' ORDER BY id DESC LIMIT 15 OFFSET ${offset}`
    );
    category_post.map((post) => (post.checked = false));

    const [[counting]] = await pool.query(
      `SELECT COUNT(*) as counting FROM category_post WHERE ${type} LIKE '%${Keyword}%'`
    );
    const [subject] = await pool.query("SELECT * FROM subject");
    const [category] = await pool.query(
      "SELECT id, name, subject, counting FROM category"
    );
    let subject_category = [];
    for (let i = 1; i <= subject.length; i++) {
      subject_category.push(category.filter((cate) => cate.subject === i));
    }
    res.json({
      category_post,
      counting: counting.counting,
      subject,
      subject_category,
    });
  }
);

router.post("/post/delete_process", async (req, res) => {
  const id = req.body.id;
  const category_id = req.body.category_id;
  await pool.query(`DELETE FROM category_post WHERE id IN (${id})`);
  if (typeof category_id === "object") {
    for (let i = 0; i < category_id.length; i++) {
      await pool.query(
        `UPDATE category SET counting=counting-1 WHERE id=${category_id[i]}`
      );
    }
  } else {
    await pool.query(
      `UPDATE category SET counting=counting-1 WHERE id=${category_id}`
    );
  }
  await pool.query(
    `DELETE FROM category_post_comment WHERE post_id IN (${id})`
  );
  await pool.query(`DELETE FROM category_post_good WHERE post_id IN (${id})`);
  await pool.query(`DELETE FROM category_post_bad WHERE post_id IN (${id})`);
  res.json({ process: true });
});

router.get("/report", async (req, res) => {
  let [category_post] = await pool.query(
    "SELECT category_post.id, title, comment, bad, report, date_format(modified, '%Y-%m-%d %h:%i') as created, category_id, report_status, users.displayName, category.name FROM category_post JOIN users ON user_id=users.id JOIN category ON category_id=category.id WHERE report>0 ORDER BY report DESC LIMIT 15"
  );
  category_post.map((post) => (post.checked = false));
  const [[counting]] = await pool.query(
    "SELECT count(*) as counting FROM category_post WHERE report>0"
  );
  res.json({ category_post, counting: counting.counting });
});

router.get("/report/page/:pageId", async (req, res) => {
  const pageId = path.parse(req.params.pageId).base;
  const offset = 15 * (pageId - 1);
  let [
    category_post,
  ] = await pool.query(
    "SELECT category_post.id, title, comment, bad, report, date_format(modified, '%Y-%m-%d %h:%i') as created, category_id, report_status, users.displayName, category.name FROM category_post JOIN users ON user_id=users.id JOIN category ON category_id=category.id WHERE report>0 ORDER BY report DESC LIMIT 15 OFFSET ?",
    [offset]
  );
  category_post.map((post) => (post.checked = false));
  const [[counting]] = await pool.query(
    "SELECT count(*) as counting FROM category_post WHERE report>0"
  );
  res.json({ category_post, counting: counting.counting });
});

router.get("/report/:status", async (req, res) => {
  const status = path.parse(req.params.status).base;
  let [
    category_post,
  ] = await pool.query(
    `SELECT category_post.id, title, comment, bad, report, date_format(modified, '%Y-%m-%d %h:%i') as created, category_id, report_status, users.displayName, category.name FROM category_post JOIN users ON user_id=users.id JOIN category ON category_id=category.id WHERE report>0 AND hit_status='${status}' ORDER BY report DESC LIMIT 15 OFFSET ?`,
    [offset]
  );
  category_post.map((post) => (post.checked = false));
  const [[counting]] = await pool.query(
    `SELECT count(*) as counting FROM category_post WHERE report>0 AND hit_status='${status}'`
  );
  res.json({ category_post, counting: counting.counting });
});

router.get("/report/search/type/:type/Keyword/:Keyword", async (req, res) => {
  const type = path.parse(req.params.type).base;
  const Keyword = path.parse(req.params.Keyword).base;
  let [category_post] = await pool.query(
    `SELECT category_post.id, title, comment, bad, report, date_format(modified, '%Y-%m-%d %h:%i') as created, category_id, report_status, users.displayName, category.name FROM category_post JOIN users ON user_id=users.id JOIN category ON category_id=category.id WHERE report>0 AND ${type} LIKE '%${Keyword}%' ORDER BY report DESC LIMIT 15`
  );
  category_post.map((post) => (post.checked = false));
  const [[counting]] = await pool.query(
    `SELECT count(*) as counting FROM category_post WHERE report>0 AND ${type} LIKE '%${Keyword}%'`
  );
  res.json({ category_post, counting: counting.counting });
});

router.get(
  "/report/search/type/:type/Keyword/:Keyword/page/:pageId",
  async (req, res) => {
    const type = path.parse(req.params.type).base;
    const Keyword = path.parse(req.params.Keyword).base;
    const pageId = path.parse(req.params.pageId).base;
    const offset = 15 * (pageId - 1);
    let [category_post] = await pool.query(
      `SELECT category_post.id, title, comment, bad, report, date_format(modified, '%Y-%m-%d %h:%i') as created, category_id, report_status, users.displayName, category.name FROM category_post JOIN users ON user_id=users.id JOIN category ON category_id=category.id WHERE report>0 AND ${type} LIKE '%${Keyword}%' ORDER BY report DESC LIMIT 15 OFFSET ${offset}`
    );
    category_post.map((post) => (post.checked = false));
    const [[counting]] = await pool.query(
      `SELECT count(*) as counting FROM category_post WHERE report>0 AND ${type} LIKE '%${Keyword}%'`
    );
    res.json({ category_post, counting: counting.counting });
  }
);

router.post("/report/select_process", async (req, res) => {
  const id = req.body.id;
  const status = req.body.status;
  if (status === "delete") {
    const [category_post] = await pool.query(
      `SELECT category_id FROM category_post WHERE id IN (${id})`
    );
    const category_id = category_post.map((item) => item.category_id).join();
    await pool.query(
      `UPDATE category SET counting=counting-1 WHERE id IN (${category_id})`
    );
    await pool.query(
      `DELETE FROM category_post_comment WHERE post_id IN (${id})`
    );
    await pool.query(`DELETE FROM category_post_good WHERE post_id IN (${id})`);
    await pool.query(`DELETE FROM category_post_bad WHERE post_id IN (${id})`);
    await pool.query(`DELETE FROM category_post WHERE id in (${id})`);
  } else {
    await pool.query(
      `UPDATE category_post SET report_status='${status}' WHERE id IN (${id})`
    );
  }
  res.json({ process: true });
});

module.exports = router;
