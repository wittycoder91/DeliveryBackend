const { WebSocketServer } = require("ws");
const express = require("express");

const app = express();
app.use(express.json());

let wss; // WebSocket server instance

// Initialize WebSocket Server
const initWebSocketServer = () => {
  return new Promise((resolve) => {
    const PORT = 7000; // WebSocket server port
    wss = new WebSocketServer({ port: PORT });

    wss.broadcast = function (data) {
      wss.clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(JSON.stringify(data));
        }
      });
    };

    wss.on("connection", (ws) => {
      console.log("WebSocket client connected");

      ws.on("message", (message) => {
        console.log("Received from client:", message);
      });

      ws.on("close", () => {
        console.log("WebSocket client disconnected");
      });

      ws.send(
        JSON.stringify({
          type: "WELCOME",
          message: "Connected to WebSocket server",
        })
      );
    });

    console.log(`WebSocket server is running on ws://localhost:${PORT}`);
    resolve(); // Resolve the promise when initialization is complete
  });
};

// Broadcast Endpoint
app.post("/broadcast", (req, res) => {
  if (wss) {
    wss.broadcast(req.body);
    res.json({ success: true, message: "Broadcast successful" });
  } else {
    res
      .status(500)
      .json({
        success: false,
        message: "WebSocket server not initialized yet",
      });
  }
});

// Start HTTP Server after WebSocket Initialization
const startServers = async () => {
  await initWebSocketServer(); // Wait for WebSocket server to initialize

  const HTTP_PORT = 6000;
  app.listen(HTTP_PORT, () => {
    console.log(
      `WebSocket HTTP API is running on http://localhost:${HTTP_PORT}`
    );
  });
};

// Start both servers
startServers();
