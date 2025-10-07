require("dotenv").config();

import express from "express";
import cors from "cors";
import { passport } from "./config/passport";
import authRouter from "./routes/auth";
import session from "express-session";
import http from "http";
import routes from "./routes"
import { io as ClientIO, Socket } from "socket.io-client";
import cookieParser from "cookie-parser";


const app = express();
const httpServer = http.createServer(app);

const port = process.env.PORT || 8000;

app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:8080/auth/google/callback",
      "https://jerusalem-ll-they-matters.trycloudflare.com",

    ],
    // origin:true,
    credentials: true
  })
);

app.use(
  session({
    secret: process.env.SESSION_SECRET as string,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

app.use(cookieParser());

app.use(passport.initialize());
app.use(passport.session());
app.use("/auth", authRouter);
app.use("/api",routes)

const webrtcSocket: Socket = ClientIO("http://localhost:4000");

webrtcSocket.on("connect", () => {
  console.log("📡 Connected to WebRTC service");
});

httpServer.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
