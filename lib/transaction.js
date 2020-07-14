module.exports = {
  transaction: async function (pool, callback) {
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
