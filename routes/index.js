const express = require("express");
const router = express.Router();
router.get("/logged", async (req, res) => {
  const user = req.user;
  if (user) {
    res.json({
      user: { id: user.id, email: user.email, displayName: user.displayName },
    });
  } else {
    res.json("not logged");
  }
});

module.exports = router;
