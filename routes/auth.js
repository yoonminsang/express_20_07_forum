const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const pool = require("../lib/pool");
const bcrypt = require("bcrypt");
const ftn = require("../lib/ftn");

module.exports = function (passport) {
  router.get("/success", function (req, res) {
    res.json("로그인했습니다");
  });
  router.get("/fail", function (req, res) {
    res.json("아이디 또는 비밀번호가 틀립니다");
  });

  router.post(
    "/signin_process",
    passport.authenticate("local", {
      successRedirect: "/auth/success",
      failureRedirect: "/auth/fail",
    })
  );

  router.post("/signup_process", async function (req, res) {
    const email = req.body.email;
    const password = req.body.password;
    const displayName = req.body.displayName;
    const [overlap] = await pool.query("SELECT id FROM users WHERE email=?", [
      email,
    ]);
    if (!ftn.isEmpty(overlap[0])) {
      res.json("이메일이 존재합니다");
      return false;
    }

    const [
      overlap2,
    ] = await pool.query("SELECT id FROM users WHERE displayName=?", [
      displayName,
    ]);
    if (!ftn.isEmpty(overlap2[0])) {
      res.json("닉네임이 존재합니다");
      return false;
    }

    let user = () => {
      return new Promise((resolve, reject) => {
        bcrypt.hash(password, 10, function (err, hash) {
          user = {
            id: uuidv4(),
            email: email,
            password: hash,
            displayName: displayName,
          };
          if (err) {
            reject(Error("error"));
          } else {
            resolve(user);
          }
        });
      });
    };
    user = await user();

    await pool.query(
      "INSERT INTO users(id, email, password, displayName) VALUES(?,?,?,?)",
      [user.id, user.email, user.password, user.displayName]
    );

    // await pool.query(
    //   "UPDATE counting set userCount = userCount + 1 where id=1"
    // );

    await (function () {
      return new Promise((resolve, reject) => {
        req.login(user, function (err) {
          if (err) {
            reject(Error("error"));
          } else {
            resolve();
            res.json({ displayName: displayName });
          }
        });
      });
    })();
  });

  router.get("/logout", function (req, res) {
    req.logout();
    req.session.destroy(function (err) {
      res.json({ logout: true });
    });
    // req.session.save(function () {
    //   res.redirect("/");
    // });
  });
  return router;
};
