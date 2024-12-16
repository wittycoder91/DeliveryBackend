let wss; // Variable to hold WebSocketServer instance

const initWebSocketServer = (server) => {
  const { WebSocketServer } = require("ws");
  wss = new WebSocketServer({ server });

  // Define the broadcast method
  wss.broadcast = function (data) {
    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(JSON.stringify(data));
      }
    });
  };

  // Handle WebSocket connections
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

  console.log("WebSocket server initialized");
};

const getWebSocketServer = () => {
  if (!wss) {
    throw new Error("WebSocket server is not initialized yet");
  }
  return wss;
};

module.exports = { initWebSocketServer, getWebSocketServer };
