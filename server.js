const express = require("express");
const app = express();
const port = process.env.PORT || 3001;
const cors = require("cors");
const bodyParser = require("body-parser");
const session = require("express-session");
// const MySQLStore = require("express-mysql-session")(session);
const helmet = require("helmet");

const corsOptions = {
  origin: "http://localhost:3000",
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(bodyParser.json());

const options = require("./config/db.json");

app.use(
  session({
    key: "session_cookie_mhealth",
    secret: require("./config/secret.json").secret,
    // store: new MySQLStore(options),
    resave: false,
    saveUninitialized: true,
    rolling: true,
    cookie: {
      maxAge: 60000 * 60 * 24 * 365,
    },
  })
);

// const serverRouter = require("./routes/server");
// app.use("/server", serverRouter);
const indexRouter = require("./routes/index");
app.use("/", indexRouter);

app.use(function (req, res, next) {
  res.status(404).send("Sorry cant find that!");
}); //404 파일 없을때

app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(500).send("Something broke!");
}); //500 오류

app.listen(port, () => console.log(`port ${port}!`));
