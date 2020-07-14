const mysql = require("mysql2");
const dbsecret = require("../config/db.json");
const db = mysql.createConnection(dbsecret);
db.connect();
module.exports = db;
