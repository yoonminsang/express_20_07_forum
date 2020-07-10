const mysql = require("mysql2/promise");
const dbsecret = require("../config/db.json");
const pool = mysql.createPool(dbsecret);
module.exports = {
  transaction: async function (callback) {
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    try {
      await callback(connection);
      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  },
};
