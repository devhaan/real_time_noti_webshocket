Real-Time Notification System with WebSockets and Redis
Overview
This system enables real-time notifications for users connected through WebSockets. It leverages Redis to efficiently manage user connections and broadcast notifications. The system also uses JWT (JSON Web Tokens) for secure authentication before establishing WebSocket connections.

Key Components:
WebSocket Server: Handles the connections from clients, authenticates them, and manages real-time communication.
Redis: Used for storing active user connections and publishing/subscribing to notification events.
Notification API: A RESTful API for triggering notifications, which is useful for external systems to send real-time updates.
1. WebSocket API Overview
WebSockets are used to establish a persistent, bi-directional communication channel between the server and clients. This is ideal for delivering notifications in real-time, allowing the server to push updates directly to the connected clients.

WebSocket Connection Flow:
Client Connects:

The client establishes a connection to the WebSocket server by sending a request to a specific WebSocket endpoint (e.g., ws://yourserver.com).
The connection is initiated with a query parameter that contains a JWT token (e.g., ws://yourserver.com?token=JWT_TOKEN_HERE).
Authentication:

The WebSocket server authenticates the client by verifying the provided JWT token.
If the token is valid, the user is authenticated, and their connection is allowed. If not, the server disconnects the client.
Storing User Data in Redis:

Upon successful authentication, the WebSocket server stores the mapping between the user's userId and their WebSocket socketId in Redis.
This is important for directing notifications to the correct user.
Real-Time Communication:

Once connected, the server listens for events and messages from the client.
The server can also push notifications to the client via the WebSocket connection when events occur.
Disconnect and Clean Up:

When the client disconnects, the WebSocket server removes the user-to-socket mapping from Redis.
Code Example: WebSocket Server
const jwt = require("jsonwebtoken");
const { pubClient } = require("../../config/redis");

const setupWebSocket = (io) => {
  io.on("connection", async (socket) => {
    const token = socket.handshake.query.token;

    if (!token) {
      console.log('No token provided.');
      socket.disconnect();  // Disconnect if no token is provided
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.SECRET_KEY);
      const userId = decoded.userId;

      // Store user-to-socket mapping in Redis
      await pubClient.set(`user:${userId}`, socket.id, (err) => {
        if (err) {
          console.error("Error storing user in Redis:", err);
        } else {
          console.log(`User data stored in Redis with key user:${userId}`);
        }
      });

      socket.on("disconnect", async () => {
        try {
          await pubClient.del(`user:${userId}`);
          console.log(`User data removed from Redis for user:${userId}`);
        } catch (err) {
          console.error("Error while deleting user from Redis:", err);
        }
      });

      socket.on("message", (data) => {
        console.log(data);
      });

    } catch (err) {
      console.error("JWT verification failed:", err.message);
      socket.disconnect(); // Disconnect if the JWT is invalid
    }
  });
};
2. JWT Authentication Process
JWT authentication ensures that only authorized users can connect to the WebSocket server and receive notifications.

Steps in JWT Authentication:
Client Request:
The client connects to the WebSocket server and passes the JWT token as a query parameter.
Token Validation:
The server extracts the token from the handshake and verifies it using a secret key stored in the environment variables.
Successful Authentication:
If the token is valid, the server decodes the token and retrieves the userId, then stores the userId and socketId mapping in Redis.
Error Handling:
If the token is invalid or missing, the server disconnects the client immediately.
3. Redis Setup and Usage
Redis is used to manage active user connections and handle message broadcasting. It acts as a store for user-to-socket mappings, ensuring that notifications can be sent to specific users or broadcasted to all connected clients.

Redis Functions:
Storing User-Socket Mapping:
When a user connects, the server stores the mapping between userId and socketId in Redis. This allows the server to know which socket to send notifications to.
Publish/Subscribe for Notifications:
Redis is used for Pub/Sub messaging. When a notification is triggered, it is published to a Redis channel. The WebSocket server subscribes to this channel and forwards the notification to the relevant users.
Redis Code Example: Notification Publisher & Subscriber

const { subClient, pubClient } = require("../../config/redis");

const sendNotificationToOneDirectionUser = async (notification) => {
  const { userId, data } = notification;
  const keys = await pubClient.keys(`user:${userId}`);
  if (keys.length > 0) {
    const socketId = await pubClient.get(keys[0]);
    if (socketId) {
      global.io.to(socketId).emit("notification", data);
    }
  }
};

const publishNotification = (notification) => {
  pubClient.publish("notifications", JSON.stringify({ notification }));
};

subClient.subscribe("notifications", (message) => {
  const { notification } = JSON.parse(message);
  sendNotificationToOneDirectionUser(notification);
});
4. Notification Trigger API
This is a RESTful API that allows external systems or services to trigger notifications. It sends a POST request to the server with the necessary information about the notification.

API Endpoint:
POST /notification:
Request Body: Contains the userId, eventType, and data for the notification.

Example:
{
  "userId": "12345",
  "eventType": "new_message",
  "data": {
    "message": "You have a new message!",
    "timestamp": "2025-01-15T14:30:00Z"
  }
}
Response: The server responds with a confirmation that the notification was triggered successfully.

Example:
{
  "message": "Notification triggered"
}
Code Example: Notification API Endpoint

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
5. Summary
This system combines WebSockets, JWT authentication, and Redis to deliver real-time notifications efficiently and securely.

WebSocket provides persistent connections for real-time communication.
JWT Authentication ensures that only authorized users can receive notifications.
Redis is used to manage user connections and to handle Pub/Sub messaging for notifications.
Notification API allows external systems to trigger notifications by sending a POST request with the relevant data.
With this setup, users receive instant notifications in a scalable and secure manner, making it ideal for applications that require real-time data updates.

This document provides an overview of the WebSocket server, JWT authentication, Redis usage, and the Notification API. If you have further questions or need additional details, feel free to reach out!
