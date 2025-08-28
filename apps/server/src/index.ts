require("dotenv").config();

import express from "express";
import cors from "cors";
import { passport } from "./config/passport";
import authRouter from "./routes/auth";
import session from "express-session";
import http from "http";
import routes from "./routes"
import { io as ClientIO, Socket } from "socket.io-client";


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
app.use(passport.initialize());
app.use(passport.session());
app.use("/auth", authRouter);
app.use("/api",routes)

const webrtcSocket: Socket = ClientIO("http://localhost:4000");

webrtcSocket.on("connect", () => {
  console.log("📡 Connected to WebRTC service");
});

// const io = new Server(httpServer, {
//   cors: {
//     origin: [
//       "http://localhost:3000",
//       "https://jerusalem-ll-they-matters.trycloudflare.com",
//     ],
//     credentials: true,
//   },
// });




httpServer.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port || 8000}`);
});

// app.listen(port || 8000, () => {
//   console.log(`Server is listening on port ${port}`);
// });



// // ---- MediaSoup setup ----
// let worker;
// //@ts-ignore
// let router;
// //@ts-ignore
// let producerTransport;
// //@ts-ignore
// let consumerTransport;
// let producer;

// const peers = new Map(); // key: socket.id
// const producers = new Map<string, mediasoup.types.Producer>();

// // Structure example:

// type PeerInfo = {
//   username: string;
//   producerTransport: mediasoup.types.WebRtcTransport | null;
//   consumerTransport: mediasoup.types.WebRtcTransport | null;
//   producer: Map<string, mediasoup.types.Producer>;
//   consumers: mediasoup.types.Consumer[];
// };

// type RoomInfo = {
//   peers: Map<string, PeerInfo>;
// };

// const rooms = new Map<string, RoomInfo>();

// app.post("/create-room", (req:Request, res:Response) => {
//   const roomId = uuidv4();
//   rooms.set(roomId, { peers: new Map() });
//   res.json({ roomId, link: `http://localhost:3000/conference/${roomId}` });
// });




// const createWorker = async () => {
//   worker = await mediasoup.createWorker();
//   console.log("🧠 MediaSoup worker created");

//   worker.on("died", () => {
//     console.error("💥 MediaSoup worker died");
//     process.exit(1);
//   });

//   router = await worker.createRouter({
//     mediaCodecs: [
//       {
//         kind: "audio",
//         mimeType: "audio/opus",
//         clockRate: 48000,
//         channels: 2,
//       },
//       {
//         kind: "video",
//         mimeType: "video/VP8",
//         clockRate: 90000,
//         parameters: {},
//       },
//       {
//         kind: "video",
//         mimeType: "video/H264", // Add H264 for Safari
//         clockRate: 90000,
//         parameters: {},
//       },
//     ],
//   });

//   //@ts-ignore
//   // global.publicIP = await getPublicIP();
//   // //@ts-ignore
//   // console.log(`🌐 Using public IP for WebRTC: ${global.publicIP}`);
// };

// createWorker();

// // ---- Socket.IO signaling ----
// io.on("connection", (socket) => {
//   console.log(`🔌 Client connected: ${socket.id}`);

//   socket.on("joinRoom", ({ roomId, username }, callback) => {
//     console.log(`👤 ${username} joined room ${roomId}`);

//     // Create room if not exists
//     if (!rooms.has(roomId)) {
//       rooms.set(roomId, { peers: new Map() });
//     }

//     const room = rooms.get(roomId)!;

//     // Save peer info to the room
//     room.peers.set(socket.id, {
//       username,
//       producerTransport: null,
//       consumerTransport: null,
//       producer: new Map(),
//       consumers: [],
//     });

//     socket.join(roomId);

//     // Send existing peers back to client
//     const otherPeers = Array.from(room.peers.entries())
//       .filter(([id]) => id !== socket.id)
//       .map(([id, p]) => ({ socketId: id, username: p.username }));

//     callback({ peers: otherPeers });

//     // Notify other peers
//     socket.to(roomId).emit("new-peer", {
//       socketId: socket.id,
//       username,
//     });
//   });

//   function getPeer(socketId: string) {
//     for (const room of rooms.values()) {
//       if (room.peers.has(socketId)) return room.peers.get(socketId);
//     }
//     return null;
//   }

//   function getRoomBySocketId(socketId: string): { roomId: string; peer: PeerInfo } | null {
//     for (const [roomId, room] of rooms.entries()) {
//       if (room.peers.has(socketId)) return { roomId, peer: room.peers.get(socketId)! };
//     }
//     return null;
//   }



//   // socket.on("getProducers", (data, callback) => {
//   //   const otherProducers = [];

//   //   for (const [otherSocketId, peer] of peers.entries()) {
//   //     if (otherSocketId === socket.id) continue; // 🛑 Skip self
//   //     if (!peer?.producer) continue;
//   //     for (const producer of peer.producer.values()) {
//   //       otherProducers.push({ producerId: producer.id });
//   //     }
//   //   }

//   //   callback(otherProducers);
//   // });

//   socket.on("getProducers", (_, callback) => {
//     const roomEntry = getRoomBySocketId(socket.id);
//     if (!roomEntry) return callback([]);

//     const { peer: currentPeer, roomId } = roomEntry;
//     const room = rooms.get(roomId);
//     if (!room) return callback([]);

//     const otherProducers = [];

//     for (const [otherSocketId, peer] of room.peers.entries()) {
//       if (otherSocketId === socket.id) continue; // skip self
//       for (const producer of peer.producer.values()) {
//         otherProducers.push({
//           producerId: producer.id,
//           socketId: otherSocketId,
//           kind: producer.kind,
//           username: peer.username
//         });
//       }
//     }

//     callback(otherProducers);
//   });



//   socket.on("getRtpCapabilities", (_, callback) => {
//     //@ts-ignore
//     callback(router.rtpCapabilities);
//   });

  

//   socket.on("createProducerTransport", async (_, callback) => {
//     const roomEntry = getRoomBySocketId(socket.id);
//     if (!roomEntry) return callback({ error: "Peer not found in any room" });

//     const { peer } = roomEntry;

//     //@ts-ignore
//     const transport = await router.createWebRtcTransport({
//       //@ts-ignore
//       listenIps: [{ ip: "127.0.0.1", announcedIp: null }],
//       enableUdp: true,
//       enableTcp: true,
//       preferTcp: true,
//       iceServers: [{ urls: "stun:stun.l.google.com:19302" }, {
//         urls: "relay1.expressturn.com:3480",
//         username: "000000002064836278",
//         credential: "pf+2Az1hVV6F2b8t8+Y5I6MCKVM=",
//       },]
//     });

//     peer.producerTransport = transport;

//     callback({
//       id: transport.id,
//       iceParameters: transport.iceParameters,
//       iceCandidates: transport.iceCandidates,
//       dtlsParameters: transport.dtlsParameters,
//     });
//   });


//   // socket.on("connectProducerTransport", async ({ dtlsParameters }, callback) => {
//   //   const peer = peers.get(socket.id);

//   //   if (!peer?.producerTransport) {
//   //     return callback({ error: "No producer transport found" });
//   //   }

//   //   if ((peer.producerTransport as any)._connected) {
//   //     console.warn("Producer transport already connected.");
//   //     return callback(); // already connected, do nothing
//   //   }

//   //   await peer.producerTransport.connect({ dtlsParameters });
//   //   (peer.producerTransport as any)._connected = true;

//   //   callback();
//   // });

//   socket.on("connectProducerTransport", async ({ dtlsParameters }, callback) => {
//     const roomEntry = getRoomBySocketId(socket.id);
//     if (!roomEntry) return callback({ error: "Peer not found in any room" });

//     const { peer } = roomEntry;

//     if (!peer.producerTransport) {
//       return callback({ error: "No producer transport found" });
//     }

//     if ((peer.producerTransport as any)._connected) {
//       console.warn("Producer transport already connected.");
//       return callback(); // no-op
//     }

//     await peer.producerTransport.connect({ dtlsParameters });
//     (peer.producerTransport as any)._connected = true;

//     callback();
//   });


//   // Add consumer logic if needed

//   socket.on("produce", async ({ kind, rtpParameters }, callback) => {
//     const roomEntry = getRoomBySocketId(socket.id);
//     if (!roomEntry) return callback({ error: "Peer not found in any room" });

//     const { peer, roomId } = roomEntry;

//     if (!peer.producerTransport) return callback({ error: "Producer transport not found" });

//     const producer = await peer.producerTransport.produce({ kind, rtpParameters });

//     // Store producer in the peer and optionally global producers map
//     peer.producer.set(producer.id, producer);

//     callback({ id: producer.id, username: peer.username });

//     // Notify ONLY peers in the same room
//     socket.to(roomId).emit("new-producer", {
//       producerId: producer.id,
//       socketId: socket.id, // Optional for matching producer to user
//       username: peer.username
//     });
//   });


//   socket.on("createConsumerTransport", async (_, callback) => {
//     const roomEntry = getRoomBySocketId(socket.id);
//     if (!roomEntry) return callback({ error: "Peer not found in any room" });

//     const { peer } = roomEntry;

//     //@ts-ignore
//     const transport = await router.createWebRtcTransport({
//       //@ts-ignore
//       listenIps: [{ ip: "127.0.0.1", announcedIp: null }],
//       enableUdp: true,
//       enableTcp: true,
//       preferTcp: true,
//       iceServers: [
//         { urls: "stun:stun.l.google.com:19302" }, {
//         urls: "relay1.expressturn.com:3480",
//         username: "000000002064836278",
//         credential: "pf+2Az1hVV6F2b8t8+Y5I6MCKVM=",
//       },
//       ]
//     });

//     peer.consumerTransport = transport;

//     callback({
//       id: transport.id,
//       iceParameters: transport.iceParameters,
//       iceCandidates: transport.iceCandidates,
//       dtlsParameters: transport.dtlsParameters,
//     });
//   });


//   socket.on("connectConsumerTransport", async ({ dtlsParameters }, callback) => {
//     // const peer = peers.get(socket.id);

//     const roomEntry = getRoomBySocketId(socket.id); // ⬅️ Your helper must return { roomId, peer }
//     if (!roomEntry) return callback({ error: "Room not found" });

//     const { peer } = roomEntry;

//     if (!peer?.consumerTransport) {
//       return callback({ error: "No consumer transport found" });
//     }

//     if ((peer.consumerTransport as any)._connected) {
//       console.warn("Consumer transport already connected.");
//       return callback("connected");
//     }

//     await peer.consumerTransport.connect({ dtlsParameters });
//     (peer.consumerTransport as any)._connected = true;

//     callback("connected");
//   });


//   socket.on("consume", async ({ producerId, rtpCapabilities }, callback) => {
//     const roomEntry = getRoomBySocketId(socket.id); // ⬅️ Your helper must return { roomId, peer }
//     if (!roomEntry) return callback({ error: "Room not found" });

//     const { peer, roomId } = roomEntry;

//     if (!peer?.consumerTransport) {
//       return callback({ error: "No consumer transport available" });
//     }

//     // Validate if router can consume
//     //@ts-ignore
//     if (!router.canConsume({ producerId, rtpCapabilities })) {
//       return callback({ error: "Cannot consume" });
//     }

//     //@ts-ignore
//     const consumer = await peer.consumerTransport.consume({
//       producerId,
//       rtpCapabilities,
//       paused: false,
//     });

//     peer.consumers.push(consumer);

//     const room = rooms.get(roomId);
//     let producerUsername = "Unknown";

//     if (room) {
//       for (const [, otherPeer] of room.peers) {
//         if (otherPeer.producer.has(producerId)) {
//           producerUsername = otherPeer.username;
//           break;
//         }
//       }
//     }

//     console.log(`this is the consumer : username : ${producerUsername} & producerId : ${producerId} , consumer kind: ${consumer.kind}`)

//     callback({
//       id: consumer.id,
//       producerId,
//       kind: consumer.kind,
//       rtpParameters: consumer.rtpParameters,
//       username: producerUsername
//     });
//   });


//   socket.on("leave-room" , async ()=>{
//     const roomInfo = getRoomBySocketId(socket.id)
//     if(!roomInfo) return;

//     const {roomId , peer} = roomInfo;

//     peer.consumers.forEach((c) => c.close())
//     peer.producer.forEach((p) => p.close())

//     peer.consumerTransport?.close()
//     peer.producerTransport?.close()

//     peers.delete(socket.id)

//     for (const producer of peer.producer.values()) {
//       socket.to(roomId).emit("producer-closed", { producerId: producer.id , username:peer.username });
//       producer.close();
//     }
    
//   })


//   socket.on("disconnect", () => {
//     console.log(`❌ Client disconnected: ${socket.id}`);

//     const roomInfo = getRoomBySocketId(socket.id);
//     if (!roomInfo) return;

//     const { roomId, peer } = roomInfo;

//     // 1. Notify other peers in the room
//     for (const producer of peer.producer.values()) {
//       socket.to(roomId).emit("producer-closed", { producerId: producer.id, username:peer.username });
//       producer.close();
//     }

//     // 2. Clean up transports and consumers
//     peer.producerTransport?.close();
//     peer.consumerTransport?.close();
//     peer.consumers.forEach((c) => c.close());

//     // 3. Remove from peers and room
//     peers.delete(socket.id);

//     const roomPeers = rooms.get(roomId);
//     if (roomPeers) {
//       roomPeers.peers.delete(socket.id)

//       // If the room is empty now, remove it
//       if (roomPeers.peers.size === 0) {
//         rooms.delete(roomId);
//         console.log(`🧹 Room ${roomId} deleted (was empty)`);
//       }
//     }

//     console.log(`👋 Cleaned up peer from room ${roomId}`);
//   });

// });



