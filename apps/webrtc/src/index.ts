require("dotenv").config();
import express from "express";
import http from "http";
import WebSocket from "ws";

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 8000;

const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  console.log("client connected");
  ws.on("message", (message) => {
    console.log("Received from client:", message.toString());
    ws.send("Hello from WebSocket server");
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

server.listen(port, () => console.log(`webrtc service is running at ${port}`));
