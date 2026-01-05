const db = require("../config/db");

const insertOrUpdateDeviceToken = async (userId, token) => {
  const query = `
    INSERT INTO devicetoken (user_id, token)
    VALUES (?, ?)
    ON DUPLICATE KEY UPDATE token = VALUES(token), updated_at = CURRENT_TIMESTAMP
  `;
  await db.execute(query, [userId, token]);
};

module.exports = {
  insertOrUpdateDeviceToken,
};
