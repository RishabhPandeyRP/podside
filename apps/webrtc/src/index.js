"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setRooms = setRooms;
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const mediasoup = __importStar(require("mediasoup"));
const state_1 = require("@repo/db/src/state");
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: { origin: "*" },
});
const PORT = process.env.WEBRTC_PORT || 4000;
// ---- MediaSoup setup ----
let worker;
//@ts-ignore
let router;
//@ts-ignore
let producerTransport;
//@ts-ignore
let consumerTransport;
let producer;
const peers = new Map(); // key: socket.id
const producers = new Map();
// Structure example:
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
const rooms = (0, state_1.getRooms)();
function setRooms(roomId) {
    rooms.set(roomId, { peers: new Map() });
}
const createWorker = () => __awaiter(void 0, void 0, void 0, function* () {
    worker = yield mediasoup.createWorker();
    console.log("🧠 MediaSoup worker created");
    worker.on("died", () => {
        console.error("💥 MediaSoup worker died");
        process.exit(1);
    });
    router = yield worker.createRouter({
        mediaCodecs: [
            {
                kind: "audio",
                mimeType: "audio/opus",
                clockRate: 48000,
                channels: 2,
            },
            {
                kind: "video",
                mimeType: "video/VP8",
                clockRate: 90000,
                parameters: {},
            },
            {
                kind: "video",
                mimeType: "video/H264", // Add H264 for Safari
                clockRate: 90000,
                parameters: {},
            },
        ],
    });
    //@ts-ignore
    // global.publicIP = await getPublicIP();
    // //@ts-ignore
    // console.log(`🌐 Using public IP for WebRTC: ${global.publicIP}`);
});
function start() {
    return __awaiter(this, void 0, void 0, function* () {
        yield createWorker();
        // ---- Socket.IO signaling ----
        io.on("connection", (socket) => {
            console.log(`🔌 Client connected: ${socket.id}`);
            socket.on("joinRoom", ({ roomId, username }, callback) => {
                console.log(`👤 ${username} joined room ${roomId}`);
                // Create room if not exists
                if (!rooms.has(roomId)) {
                    rooms.set(roomId, { peers: new Map() });
                }
                const room = rooms.get(roomId);
                // Save peer info to the room
                room.peers.set(socket.id, {
                    username,
                    producerTransport: null,
                    consumerTransport: null,
                    producer: new Map(),
                    consumers: [],
                });
                socket.join(roomId);
                // Send existing peers back to client
                const otherPeers = Array.from(room.peers.entries())
                    .filter(([id]) => id !== socket.id)
                    .map(([id, p]) => ({ socketId: id, username: p.username }));
                callback({ peers: otherPeers });
                // Notify other peers
                socket.to(roomId).emit("new-peer", {
                    socketId: socket.id,
                    username,
                });
            });
            function getPeer(socketId) {
                for (const room of rooms.values()) {
                    if (room.peers.has(socketId))
                        return room.peers.get(socketId);
                }
                return null;
            }
            function getRoomBySocketId(socketId) {
                for (const [roomId, room] of rooms.entries()) {
                    if (room.peers.has(socketId))
                        return { roomId, peer: room.peers.get(socketId) };
                }
                return null;
            }
            // socket.on("getProducers", (data, callback) => {
            //   const otherProducers = [];
            //   for (const [otherSocketId, peer] of peers.entries()) {
            //     if (otherSocketId === socket.id) continue; // 🛑 Skip self
            //     if (!peer?.producer) continue;
            //     for (const producer of peer.producer.values()) {
            //       otherProducers.push({ producerId: producer.id });
            //     }
            //   }
            //   callback(otherProducers);
            // });
            socket.on("getProducers", (_, callback) => {
                const roomEntry = getRoomBySocketId(socket.id);
                if (!roomEntry)
                    return callback([]);
                const { peer: currentPeer, roomId } = roomEntry;
                const room = rooms.get(roomId);
                if (!room)
                    return callback([]);
                const otherProducers = [];
                for (const [otherSocketId, peer] of room.peers.entries()) {
                    if (otherSocketId === socket.id)
                        continue; // skip self
                    for (const producer of peer.producer.values()) {
                        otherProducers.push({
                            producerId: producer.id,
                            socketId: otherSocketId,
                            kind: producer.kind,
                            username: peer.username
                        });
                    }
                }
                callback(otherProducers);
            });
            socket.on("getRtpCapabilities", (_, callback) => {
                //@ts-ignore
                callback(router.rtpCapabilities);
            });
            socket.on("createProducerTransport", (_, callback) => __awaiter(this, void 0, void 0, function* () {
                const roomEntry = getRoomBySocketId(socket.id);
                if (!roomEntry)
                    return callback({ error: "Peer not found in any room" });
                const { peer } = roomEntry;
                //@ts-ignore
                const transport = yield router.createWebRtcTransport({
                    //@ts-ignore
                    listenIps: [{ ip: "127.0.0.1", announcedIp: null }],
                    enableUdp: true,
                    enableTcp: true,
                    preferTcp: true,
                    iceServers: [{ urls: "stun:stun.l.google.com:19302" }, {
                            urls: "relay1.expressturn.com:3480",
                            username: "000000002064836278",
                            credential: "pf+2Az1hVV6F2b8t8+Y5I6MCKVM=",
                        },]
                });
                peer.producerTransport = transport;
                callback({
                    id: transport.id,
                    iceParameters: transport.iceParameters,
                    iceCandidates: transport.iceCandidates,
                    dtlsParameters: transport.dtlsParameters,
                });
            }));
            // socket.on("connectProducerTransport", async ({ dtlsParameters }, callback) => {
            //   const peer = peers.get(socket.id);
            //   if (!peer?.producerTransport) {
            //     return callback({ error: "No producer transport found" });
            //   }
            //   if ((peer.producerTransport as any)._connected) {
            //     console.warn("Producer transport already connected.");
            //     return callback(); // already connected, do nothing
            //   }
            //   await peer.producerTransport.connect({ dtlsParameters });
            //   (peer.producerTransport as any)._connected = true;
            //   callback();
            // });
            socket.on("connectProducerTransport", (_a, callback_1) => __awaiter(this, [_a, callback_1], void 0, function* ({ dtlsParameters }, callback) {
                const roomEntry = getRoomBySocketId(socket.id);
                if (!roomEntry)
                    return callback({ error: "Peer not found in any room" });
                const { peer } = roomEntry;
                if (!peer.producerTransport) {
                    return callback({ error: "No producer transport found" });
                }
                if (peer.producerTransport._connected) {
                    console.warn("Producer transport already connected.");
                    return callback(); // no-op
                }
                yield peer.producerTransport.connect({ dtlsParameters });
                peer.producerTransport._connected = true;
                callback();
            }));
            // Add consumer logic if needed
            socket.on("produce", (_a, callback_1) => __awaiter(this, [_a, callback_1], void 0, function* ({ kind, rtpParameters }, callback) {
                const roomEntry = getRoomBySocketId(socket.id);
                if (!roomEntry)
                    return callback({ error: "Peer not found in any room" });
                const { peer, roomId } = roomEntry;
                if (!peer.producerTransport)
                    return callback({ error: "Producer transport not found" });
                const producer = yield peer.producerTransport.produce({ kind, rtpParameters });
                // Store producer in the peer and optionally global producers map
                peer.producer.set(producer.id, producer);
                callback({ id: producer.id, username: peer.username });
                // Notify ONLY peers in the same room
                socket.to(roomId).emit("new-producer", {
                    producerId: producer.id,
                    socketId: socket.id, // Optional for matching producer to user
                    username: peer.username
                });
            }));
            socket.on("createConsumerTransport", (_, callback) => __awaiter(this, void 0, void 0, function* () {
                const roomEntry = getRoomBySocketId(socket.id);
                if (!roomEntry)
                    return callback({ error: "Peer not found in any room" });
                const { peer } = roomEntry;
                //@ts-ignore
                const transport = yield router.createWebRtcTransport({
                    //@ts-ignore
                    listenIps: [{ ip: "127.0.0.1", announcedIp: null }],
                    enableUdp: true,
                    enableTcp: true,
                    preferTcp: true,
                    iceServers: [
                        { urls: "stun:stun.l.google.com:19302" }, {
                            urls: "relay1.expressturn.com:3480",
                            username: "000000002064836278",
                            credential: "pf+2Az1hVV6F2b8t8+Y5I6MCKVM=",
                        },
                    ]
                });
                peer.consumerTransport = transport;
                callback({
                    id: transport.id,
                    iceParameters: transport.iceParameters,
                    iceCandidates: transport.iceCandidates,
                    dtlsParameters: transport.dtlsParameters,
                });
            }));
            socket.on("connectConsumerTransport", (_a, callback_1) => __awaiter(this, [_a, callback_1], void 0, function* ({ dtlsParameters }, callback) {
                // const peer = peers.get(socket.id);
                const roomEntry = getRoomBySocketId(socket.id); // ⬅️ Your helper must return { roomId, peer }
                if (!roomEntry)
                    return callback({ error: "Room not found" });
                const { peer } = roomEntry;
                if (!(peer === null || peer === void 0 ? void 0 : peer.consumerTransport)) {
                    return callback({ error: "No consumer transport found" });
                }
                if (peer.consumerTransport._connected) {
                    console.warn("Consumer transport already connected.");
                    return callback("connected");
                }
                yield peer.consumerTransport.connect({ dtlsParameters });
                peer.consumerTransport._connected = true;
                callback("connected");
            }));
            socket.on("consume", (_a, callback_1) => __awaiter(this, [_a, callback_1], void 0, function* ({ producerId, rtpCapabilities }, callback) {
                const roomEntry = getRoomBySocketId(socket.id); // ⬅️ Your helper must return { roomId, peer }
                if (!roomEntry)
                    return callback({ error: "Room not found" });
                const { peer, roomId } = roomEntry;
                if (!(peer === null || peer === void 0 ? void 0 : peer.consumerTransport)) {
                    return callback({ error: "No consumer transport available" });
                }
                // Validate if router can consume
                //@ts-ignore
                if (!router.canConsume({ producerId, rtpCapabilities })) {
                    return callback({ error: "Cannot consume" });
                }
                //@ts-ignore
                const consumer = yield peer.consumerTransport.consume({
                    producerId,
                    rtpCapabilities,
                    paused: false,
                });
                peer.consumers.push(consumer);
                const room = rooms.get(roomId);
                let producerUsername = "Unknown";
                if (room) {
                    for (const [, otherPeer] of room.peers) {
                        if (otherPeer.producer.has(producerId)) {
                            producerUsername = otherPeer.username;
                            break;
                        }
                    }
                }
                console.log(`this is the consumer : username : ${producerUsername} & producerId : ${producerId} , consumer kind: ${consumer.kind}`);
                callback({
                    id: consumer.id,
                    producerId,
                    kind: consumer.kind,
                    rtpParameters: consumer.rtpParameters,
                    username: producerUsername
                });
            }));
            socket.on("leave-room", () => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const roomInfo = getRoomBySocketId(socket.id);
                if (!roomInfo)
                    return;
                const { roomId, peer } = roomInfo;
                peer.consumers.forEach((c) => c.close());
                peer.producer.forEach((p) => p.close());
                (_a = peer.consumerTransport) === null || _a === void 0 ? void 0 : _a.close();
                (_b = peer.producerTransport) === null || _b === void 0 ? void 0 : _b.close();
                peers.delete(socket.id);
                for (const producer of peer.producer.values()) {
                    socket.to(roomId).emit("producer-closed", { producerId: producer.id, username: peer.username });
                    producer.close();
                }
            }));
            socket.on("disconnect", () => {
                var _a, _b;
                console.log(`❌ Client disconnected: ${socket.id}`);
                const roomInfo = getRoomBySocketId(socket.id);
                if (!roomInfo)
                    return;
                const { roomId, peer } = roomInfo;
                // 1. Notify other peers in the room
                for (const producer of peer.producer.values()) {
                    socket.to(roomId).emit("producer-closed", { producerId: producer.id, username: peer.username });
                    producer.close();
                }
                // 2. Clean up transports and consumers
                (_a = peer.producerTransport) === null || _a === void 0 ? void 0 : _a.close();
                (_b = peer.consumerTransport) === null || _b === void 0 ? void 0 : _b.close();
                peer.consumers.forEach((c) => c.close());
                // 3. Remove from peers and room
                peers.delete(socket.id);
                const roomPeers = rooms.get(roomId);
                if (roomPeers) {
                    roomPeers.peers.delete(socket.id);
                    // If the room is empty now, remove it
                    if (roomPeers.peers.size === 0) {
                        rooms.delete(roomId);
                        console.log(`🧹 Room ${roomId} deleted (was empty)`);
                    }
                }
                console.log(`👋 Cleaned up peer from room ${roomId}`);
            });
        });
        server.listen(PORT, () => {
            console.log(`🚀 WebRTC service listening on http://localhost:${PORT}`);
        });
    });
}
start();
