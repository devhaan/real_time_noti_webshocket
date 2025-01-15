const { pubClient } = require("../../config/redis");
const jwt = require("jsonwebtoken"); 

const setupWebSocket = (io) => {
  io.on("connection", async (socket) => {
    // Get JWT token from the query parameters in the handshake
    const token = socket.handshake.query.token;

    if (!token) {
      console.log('No token provided.');
      socket.disconnect();  // Disconnect the client if no token is provided
      return;
    }

    // Verify the JWT token
    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        console.log(`Authenticated user ID: ${decoded.userId}`);

        // Store the userId in the socket for later reference
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
          console.log(`User disconnected: ${userId}`);
          await pubClient.del(`user:${userId}`);
          console.log(`User data removed from Redis for user:${userId}`);
        } catch (err) {
          console.error("Error while deleting user from Redis:", err);
        }
      });

      socket.on("error", (err) => {
        console.error("Socket error:", err);
        socket.disconnect();
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

module.exports = { setupWebSocket };
