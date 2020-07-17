const pool = require("../lib/pool");
const bcrypt = require("bcrypt");

module.exports = function (app) {
  const passport = require("passport"),
    LocalStrategy = require("passport-local").Strategy;

  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser(async function (user, done) {
    console.log("serializeUser", user);
    done(null, user.id);
  });

  passport.deserializeUser(async function (id, done) {
    const [[user]] = await pool.query("SELECT * FROM users WHERE id=?", [id]);
    console.log("deserializeUser", id, user);
    done(null, user);
  });

  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async function (email, password, done) {
        console.log("LocalStrategy", email, password);
        const [[user]] = await pool.query("SELECT * FROM users WHERE email=?", [
          email,
        ]);
        if (user) {
          bcrypt.compare(password, user.password, function (err, res) {
            if (err) throw err;
            if (res) {
              return done(null, user);
            } else {
              return done(null, false);
            }
          });
        } else {
          return done(null, false);
        }
      }
    )
  );
  return passport;
};
