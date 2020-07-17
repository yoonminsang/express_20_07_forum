const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const pool = require("../lib/pool");
const bcrypt = require("bcrypt");
const isEmpty = (value) => {
  if (
    value === "" ||
    value === null ||
    value === undefined ||
    (value !== null && typeof value === "object" && !Object.keys(value).length)
  ) {
    return true;
  } else {
    return false;
  }
};

module.exports = function (passport) {
  router.get("/fail", function (req, res) {
    res.json("아이디 또는 비밀번호가 틀립니다");
  });

  router.post(
    "/signin_process",
    passport.authenticate("local", {
      successRedirect: "/logged",
      failureRedirect: "/auth/fail",
    })
  );

  router.post("/signup_process", async function (req, res) {
    const email = req.body.email;
    const password = req.body.password;
    const displayName = req.body.displayName;
    const [[overlap]] = await pool.query("SELECT id FROM users WHERE email=?", [
      email,
    ]);
    if (!isEmpty(overlap)) {
      res.json("이메일이 존재합니다");
      return false;
    }

    const [
      [overlap2],
    ] = await pool.query("SELECT id FROM users WHERE displayName=?", [
      displayName,
    ]);
    if (!isEmpty(overlap2)) {
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

    await (function () {
      return new Promise((resolve, reject) => {
        req.login(user, function (err) {
          if (err) {
            reject(Error("error"));
          } else {
            resolve();
            res.redirect("/logged");
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
