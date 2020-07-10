const db = require("../lib/db");
const bcrypt = require("bcrypt");

module.exports = function (app) {
  var passport = require("passport"),
    LocalStrategy = require("passport-local").Strategy; //session다음에 넣어야 돼
  // FacebookStrategy = require("passport-facebook").Strategy;

  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser(function (user, done) {
    console.log("serializeUser", user);
    done(null, user.id);
  });

  passport.deserializeUser(function (id, done) {
    db.query(`SELECT * FROM users WHERE id=?`, [id], function (err, user) {
      if (err) throw err;
      console.log("deserializeUser", id, user);
      done(null, user);
    });
  });

  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      function (email, password, done) {
        console.log("LocalStrategy", email, password);
        db.query(`SELECT * FROM users WHERE email=?`, [email], function (
          err,
          user
        ) {
          if (err) {
            throw err;
          }
          if (user) {
            bcrypt.compare(password, user[0].password, function (err2, res) {
              if (err2) throw err2;
              if (res) {
                return done(null, user[0]);
              } else {
                return done(null, false);
              }
            });
          } else {
            return done(null, false);
          }
        });
      }
    )
  );
  return passport;
};
