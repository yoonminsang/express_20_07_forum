const express = require("express");
const router = express.Router();
const pool = require("../lib/pool");
const path = require("path");

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
  res.json({ notice_post, notice_counting });
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

module.exports = router;
