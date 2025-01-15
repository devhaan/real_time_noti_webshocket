const { subClient, pubClient } = require("../../config/redis");
const { constants } = require("../../helper/constants");


const sendNotificationToOneDirectionUser = async (notification) => {
  const { userId, data } = notification;
  const keys = await pubClient.keys(`user:${userId}`);
  console.log(keys)
  if (keys.length > 0) {
    const socketId = await pubClient.get(keys[0]);
    if (socketId) {
      global.io.to(socketId).emit("notification", data);
    }
  }
};

const sendNotificationToAllUsers = async (notification) => {
  const keys = await pubClient.keys("*");

  if (keys.length === 0) {
    console.log("No active users connected");
    return;
  }

  const socketIds = await Promise.all(keys.map((key) => pubClient.get(key)));

  for (let i = 0; i < socketIds.length; i += constants.BATCH_SIZE) {
    const batch = socketIds.slice(i, i + constants.BATCH_SIZE);

    await Promise.all(
      batch.map((socketId) => socketId && global.io.to(socketId).emit("notification", notification))
    );
  }

  console.log("Notification sent to all users");
};

const sendNotificationToAll = async (notification) => {
  try {
    if (notification.eventType === constants.ONE_DIRECTION) {
      await sendNotificationToOneDirectionUser(notification);
    } else if (notification.eventType === constants.BROADCAST) {
      await sendNotificationToAllUsers(notification);
    }
  } catch (err) {
    console.error("Error sending notification:", err);
  }
};

const publishNotification = (notification) => {
  pubClient.publish("notifications", JSON.stringify({ notification }));
};

// Subscription for incoming notifications
subClient.subscribe("notifications", (message) => {
  const { notification } = JSON.parse(message);
  sendNotificationToAll(notification);
});

module.exports = { sendNotificationToAll, publishNotification };
