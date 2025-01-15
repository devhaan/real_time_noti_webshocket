const { expect } = require("chai");
const io = require("socket.io-client");
const redisMock = require("redis-mock");
const { setupWebSocket } = require("../controllers/websoket");

describe("WebSocket Connection", () => {
  let server;
  let clientSocket;
  let mockPubClient; 

  before((done) => {
   
    mockPubClient = redisMock.createClient();
    const subClient = redisMock.createClient(); 

    
    server = require("http").createServer();
    const ioServer = require("socket.io")(server);
    setupWebSocket(ioServer, mockPubClient); 

    server.listen(5000, () => done());
  });

  it("should establish a WebSocket connection with a valid userId", (done) => {
    clientSocket = io.connect("http://localhost:5000", {
      query: { userId: "user:devendra" },
      reconnect: false,
    });

    clientSocket.on("connect", () => {
      mockPubClient.get("user:devendra", (err, socketId) => {
        if (err) done(err);
        expect(socketId).to.not.be.null;
        done();
      });
    });
  });

  it("should disconnect and remove user from Redis on disconnect", (done) => {
    clientSocket = io.connect("http://localhost:5000", {
      query: { userId: "devendra" },
    });

    clientSocket.on("connect", () => {
      clientSocket.disconnect();

      // Use mockPubClient to check the removal of user data
      mockPubClient.get("user:devendra", (err, socketId) => {
        if (err) done(err);
        expect(socketId).to.be.null;
        done();
      });
    });
  });

  after((done) => {
    if (clientSocket) {
      clientSocket.disconnect();
    }
    if (server) {
      server.close(done);
    }
  });
});
