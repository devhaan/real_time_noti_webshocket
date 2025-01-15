const { createClient } = require('redis');
const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');

// Create Redis client instances
const pubClient = createClient({ url: "redis://localhost:6379" });
const subClient = pubClient.duplicate();

// Connect to Redis
(async () => {
  await Promise.all([
    pubClient.connect(),
    subClient.connect()
  ]);

  // Create Socket.IO server and use Redis adapter
  const io = new Server({
    adapter: createAdapter(pubClient, subClient)
  });
})();

module.exports = { pubClient, subClient };
