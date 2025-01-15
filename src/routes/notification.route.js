const express = require("express");
const { publishNotification } = require("../controllers/notification");

const router = express.Router();

router.post("/", (req, res) => {
  const { userId, eventType, data } = req.body;
  if (!userId || !eventType || !data) {
    return res.status(400).json({ error: "Invalid payload" });
  }
  const notification = { userId, eventType, data };
  publishNotification(notification);
  res.status(200).json({ message: "Notification triggered" });
});

module.exports = router;
