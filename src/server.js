const dotenv = require("dotenv");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const bodyParser = require("body-parser");
const { setupWebSocket } = require("./controllers/websoket");
const notificationRoutes = require("./routes/notification.route");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(bodyParser.urlencoded({ extended: true }));

dotenv.config({ path: __dirname + "/.env" });

global.io = io;

app.use(express.json());
app.use("/api/notifications", notificationRoutes);

setupWebSocket(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
