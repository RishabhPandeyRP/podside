"use client";
import React, { useEffect, useRef, useState } from "react";
import { Device } from "mediasoup-client";
import io from "socket.io-client";
import { openDB } from 'idb';
import { toast } from 'react-hot-toast';
import { useParams } from 'next/navigation';
import { useSearchParams } from "next/navigation";
import { Mail, Video, Shield, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { apiRequest } from "../../../lib/api";

const socket = io("http://localhost:4000", { withCredentials: true, transports: ["websocket"] });


const validateRoom = async (roomId: string, email: string) => {
    let searchField = ""
    if (email.trim() == "" || email == null) {
        searchField = `/api/room/validate/${roomId}`
    } else {
        searchField = `/api/room/validate/${roomId}?email=${email}`
    }
    // Mock validation logic - replace with your actual API call
    const data = await apiRequest(searchField, "GET") as {
        message: string,
        room: {
            id: string,
            status: string,
            roomName: string,
            expiresAt: string
        }
    };

    //@ts-ignore
    if (!data?.room) {
        throw new Error(data.message);
    }

    return data?.room;
};


export default function Conference() {
    const { roomIdUrl } = useParams()
    const searchParams = useSearchParams();
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const [remoteStreams, setRemoteStreams] = useState<{ id: string; stream: MediaStream; username: string }[]>([]);
    const deviceRef = useRef<Device | null>(null);
    const recvTransportRef = useRef<any>(null);
    const consumedProducerIds = useRef<Set<string>>(new Set());
    const ownProducerId = useRef<Set<string> | null>(new Set());
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);

    const [isAudioMuted, setAudioMuted] = useState<boolean>(false);
    const [isVideoMuted, setVideoMuted] = useState<boolean>(false);

    const [username, setUsername] = useState("");
    const [roomId, setRoomId] = useState("");
    const [hasJoined, setHasJoined] = useState(false);

    const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
    const screenProducerId = useRef<string | null>(null);
    const sendTransportRef = useRef<any>(null);
    const userInteracted = useRef(false);
    const [newParticipants, setNewParticipants] = useState<Set<string>>(new Set());
    const [isRecording, setIsRecording] = useState(false);

    const [isValidating, setIsValidating] = useState(true);
    const [isLeavingRoom, setIsLeaving] = useState(false);
    const [isRoomValid, setIsRoomValid] = useState(false);
    const [validationError, setValidationError] = useState("");
    const [roomDetails, setRoomDetails] = useState<any>(null);
    const [email, setEmail] = useState("");

    // New states for redirect functionality
    const [hasLeftRoom, setHasLeftRoom] = useState(false);
    const [redirectCountdown, setRedirectCountdown] = useState(10);


    // Email validation function
    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };


    // Room validation effect
    useEffect(() => {
        const performRoomValidation = async () => {
            if (!roomIdUrl) return;

            setRoomId(roomIdUrl as string);
            setIsValidating(true);
            setValidationError("");

            try {
                // For initial validation, we'll use a placeholder email
                // The actual email validation will happen when user tries to join
                const response = await validateRoom(roomIdUrl as string, "");
                setRoomDetails(response);
                setIsRoomValid(true);
            } catch (error: any) {
                setValidationError(error.message || "Failed to validate room");
                setIsRoomValid(false);
            } finally {
                setIsValidating(false);
            }
        };

        performRoomValidation();
    }, [roomIdUrl]);

    // Redirect countdown effect
    useEffect(() => {
        if (hasLeftRoom && redirectCountdown > 0) {
            const timer = setTimeout(() => {
                setRedirectCountdown(redirectCountdown - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (hasLeftRoom && redirectCountdown === 0) {
            window.location.href = '/';
        }
    }, [hasLeftRoom, redirectCountdown]);

    // utils/db.ts
    const initDB = async () => {
        return openDB('recordingsDB', 1, {
            upgrade(db) {
                if (!db.objectStoreNames.contains('chunks')) {
                    db.createObjectStore('chunks', { keyPath: 'timestamp' });
                }
            },
        });
    };

    const saveChunk = async (blob: Blob) => {
        const db = await initDB();
        const tx = db.transaction('chunks', 'readwrite');
        const store = tx.objectStore('chunks');
        await store.put({ timestamp: Date.now(), blob });
        await tx.done; // ✅ Works only with `idb` wrapper
    };

    // Add new participant effect
    const addNewParticipantEffect = (producerId: string) => {
        setNewParticipants(prev => new Set([...prev, producerId]));
        setTimeout(() => {
            setNewParticipants(prev => {
                const updated = new Set(prev);
                updated.delete(producerId);
                return updated;
            });
        }, 2000);
    };


    useEffect(() => {
        if (roomIdUrl) {
            setRoomId(roomIdUrl as string)
        }
    }, [roomIdUrl, searchParams])


    const joinRoom = async () => {
        if (!username.trim()) {
            toast.error("Please enter your name");
            return;
        }

        if (!email.trim()) {
            toast.error("Please enter your email");
            return;
        }

        if (!validateEmail(email)) {
            toast.error("Please enter a valid email address");
            return;
        }

        if (!username || !roomId) return alert("Please enter username and room");
        // Validate room with user's email
        try {
            setIsValidating(true);
            await validateRoom(roomId, email);
        } catch (error: any) {
            toast.error(error.message || "Access denied to this room");
            setIsValidating(false);
            return;
        } finally {
            setIsValidating(false);
        }

        userInteracted.current = true;


        socket.emit("joinRoom", { username, roomId }, (response: any) => {
            console.log("joined room response : ", response)
        });

        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true,
        });

        setLocalStream(stream);
        setHasJoined(true);

        const device = new Device();
        deviceRef.current = device;

        const rtpCapabilities = await new Promise((res) =>
            socket.emit("getRtpCapabilities", null, res)
        );
        //@ts-ignore
        await device.load({ routerRtpCapabilities: rtpCapabilities });

        const existingProducers = await new Promise((res) =>
            socket.emit("getProducers", null, res)
        );

        const recvTransportData = await new Promise((res) =>
            socket.emit("createConsumerTransport", null, res)
        );
        //@ts-ignore
        const recvTransport = device.createRecvTransport(recvTransportData);
        recvTransportRef.current = recvTransport;

        recvTransport.on("connect", ({ dtlsParameters }, callback, errback) => {
            socket.emit("connectConsumerTransport", { dtlsParameters }, (response: any) => {
                //@ts-ignore
                response === "connected" ? callback() : errback();
            });
        });

        const consumeRemote = async (producerId: string) => {
            if (ownProducerId.current?.has(producerId)) return;
            if (consumedProducerIds.current.has(producerId)) return;

            consumedProducerIds.current.add(producerId);

            const device = deviceRef.current;
            const recvTransport = recvTransportRef.current;
            if (!device || !recvTransport) return;

            const consumerData = await new Promise((res, rej) =>
                socket.emit(
                    "consume",
                    {
                        producerId,
                        rtpCapabilities: device.rtpCapabilities,
                    },
                    (data: any) => {
                        if (data?.error) rej(data.error);
                        else res(data);
                    }
                )
            );

            const consumer = await recvTransport.consume({
                //@ts-ignore
                id: consumerData.id,
                //@ts-ignore
                producerId: consumerData.producerId,
                //@ts-ignore
                kind: consumerData.kind,
                //@ts-ignore
                rtpParameters: consumerData.rtpParameters,
            });

            console.log("📡 Consumed track:", consumer.track.kind);

            setRemoteStreams((prev) => {

                const existing = prev.find((item) => item.id === producerId);

                if (existing) {

                    const newStream = new MediaStream([
                        ...existing.stream.getTracks(),
                        consumer.track,
                    ]);

                    return prev.map((item) =>
                        item.id === producerId
                            ? { ...item, stream: newStream }
                            : item
                    );
                } else {

                    const stream = new MediaStream([consumer.track]);

                    // Trigger side-effect if it's a video track
                    if (consumer.track.kind === 'video') {
                        addNewParticipantEffect(producerId);
                    }

                    return [
                        ...prev,
                        {
                            id: producerId,
                            stream,
                            //@ts-ignore
                            username: consumerData.username,
                        },
                    ];
                }

                // return updated;
            });
        };



        //@ts-ignore
        for (const { producerId } of existingProducers) {
            await consumeRemote(producerId);
        }

        const sendTransportData = await new Promise((res) =>
            socket.emit("createProducerTransport", null, res)
        );
        //@ts-ignore
        const sendTransport = device.createSendTransport(sendTransportData);
        sendTransportRef.current = sendTransport

        sendTransport.on("connect", ({ dtlsParameters }, callback) => {
            socket.emit("connectProducerTransport", { dtlsParameters }, callback);
        });

        sendTransport.on("produce", async ({ kind, rtpParameters }, callback) => {
            //@ts-ignore
            const { id } = await new Promise((res) =>
                socket.emit("produce", { kind, rtpParameters }, res)
            );
            ownProducerId.current?.add(id);
            callback({ id });
        });

        stream.getTracks().forEach((track) => {
            sendTransport.produce({ track });
        });

        socket.on("new-producer", async ({ producerId }) => {
            try {
                if (!device.loaded) return;
                console.log("new producer : ", producerId);
                await consumeRemote(producerId);
            } catch (err) {
                console.error("Failed to consume new producer:", err);
            }
        });

        socket.on("producer-closed", ({ producerId, username }) => {
            console.log("🚫 Remote producer closed:", producerId);

            setRemoteStreams((prev) => {
                const updated = prev.filter((item) => item.id !== producerId);
                const removed = prev.find((item) => item.id === producerId);
                removed?.stream.getTracks().forEach((track) => track.stop());
                return updated;
            });

            consumedProducerIds.current.delete(producerId);
            toast(`${username} left the meeting`)
        });
    };

    useEffect(() => {
        if (localStream && hasJoined && localVideoRef.current) {
            localVideoRef.current.srcObject = localStream;
            localVideoRef.current.play().catch(() => { });
        }
    }, [localStream, hasJoined]);


    const audioHandler = () => {
        if (!localStream) return;
        localStream.getAudioTracks().forEach((track) => (track.enabled = isAudioMuted));
        setAudioMuted(!isAudioMuted);
    };

    const videoHandler = () => {
        if (!localStream) return;
        localStream.getVideoTracks().forEach((track) => (track.enabled = isVideoMuted));
        setVideoMuted(!isVideoMuted);
    };

    const shareScreen = async () => {
        if (!sendTransportRef.current) return alert("Send transport not ready");

        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true, // change to true if you want to capture system audio (limited browser support)
            });

            setScreenStream(stream);

            const screenTrack = stream.getVideoTracks()[0];
            const producer = await sendTransportRef.current.produce({ track: screenTrack });

            console.log("Producer track readyState:", producer.track.readyState);
            console.log("Producer track enabled:", producer.track.enabled);


            screenProducerId.current = producer.id;
            ownProducerId.current?.add(producer.id);

            // When user stops sharing from browser UI
            //@ts-ignore
            screenTrack.onended = () => {
                stopScreenShare();
            };
        } catch (err) {
            console.error("Error sharing screen:", err);
        }
    };

    const stopScreenShare = () => {
        if (!screenProducerId.current) return;

        socket.emit("closeProducer", { producerId: screenProducerId.current });

        ownProducerId.current?.delete(screenProducerId.current);
        screenProducerId.current = null;

        if (screenStream) {
            screenStream.getTracks().forEach((track) => track.stop());
            setScreenStream(null);
        }
    };

    const disconnect = async () => {
        try {
            setIsLeaving(true)
            const searchField = `/api/room/leaveParticipant/${roomId}?email=${email}`
            const data = await apiRequest(searchField, "GET") as {
                message: string,
                participant: {
                    id: string,
                    roomId: string,
                    email: string,
                    isJoined: boolean,
                    joinedAt: string,
                    leftAt: string,
                    role: string
                }
            };

            if (!data.participant) {
                throw new Error(data.message)
            }
            setHasLeftRoom(true);
        } catch (error: any) {
            console.error("error while leaving the room")
            toast.error(error.message || "error while leaving the room")
        }
        finally {
            if (localStream) {
                localStream.getTracks().forEach((track) => {
                    track.stop()
                })
                setLocalStream(null)
            }

            if (screenStream) {
                screenStream.getTracks().forEach(track => track.stop())
                setScreenStream(null)
            }

            setRemoteStreams(prev => {
                prev.forEach(({ stream }) => {
                    stream.getTracks().forEach(track => track.stop())
                })
                return []
            })

            sendTransportRef.current?.close()
            sendTransportRef.current = null
            recvTransportRef.current?.close()
            recvTransportRef.current = null

            consumedProducerIds.current?.clear()
            ownProducerId.current?.clear()

            deviceRef.current = null

            socket.emit("leave-room")

            setHasJoined(false)
            setUsername("")
            setRoomId("")
            setIsLeaving(false)
        }

    }

    useEffect(() => {
        remoteStreams.forEach(({ id, stream }) => {
            console.log(`🧩 Stream ${id}: A=${stream.getAudioTracks().length}, V=${stream.getVideoTracks().length}`);
        });
    }, [remoteStreams]);

    useEffect(() => {
        if (!localStream || !hasJoined) return;

        const mediaRecorder = new MediaRecorder(localStream, {
            mimeType: "video/webm;codecs=vp9,opus",
        });

        mediaRecorder.ondataavailable = async (e) => {
            if (e.data && e.data.size > 0) {
                await saveChunk(e.data);
                console.log("📦 Saved chunk:", e.data.size);
            }
        };

        mediaRecorder.onstart = () => {
            setIsRecording(true);
        };

        mediaRecorder.onstop = () => {
            setIsRecording(false);
        };

        mediaRecorder.start(5000); // every 5 sec

        console.log("📹 Recorder started");

        return () => {
            mediaRecorder.stop();
            console.log("🛑 Recorder stopped");
        };
    }, [localStream, hasJoined]);

    // Render redirect screen when user has left the room
    if (hasLeftRoom) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mb-6">
                        <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>

                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        Meeting Ended
                    </h1>

                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        You have successfully left the meeting room.
                    </p>

                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mb-6">
                        <p className="text-green-700 dark:text-green-300 font-medium mb-2">
                            Redirecting to homepage...
                        </p>
                        <div className="flex items-center justify-center gap-3">
                            <div className="w-8 h-8 border-3 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {redirectCountdown}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={() => window.location.href = '/'}
                        className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                        Go to Home Now
                    </button>
                </div>
            </div>
        );
    }

    // Render splash screen while validating
    if (isValidating) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-6">
                        <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>

                    <div className="flex items-center justify-center gap-3 mb-4">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                            Validating Room
                        </h1>
                    </div>

                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Please wait while we verify the meeting room...
                    </p>

                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                            Room ID: <span className="font-mono text-blue-600 dark:text-blue-400">{roomIdUrl}</span>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Render error screen if room validation failed
    if (!isRoomValid) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full mb-6">
                        <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                    </div>

                    <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        Room Access Denied
                    </h1>

                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        {validationError || "This room is not accessible or may have expired."}
                    </p>

                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-6">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                            Room ID: <span className="font-mono text-red-600 dark:text-red-400">{roomIdUrl}</span>
                        </p>
                    </div>

                    <button
                        onClick={() => window.location.href = '/'}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Go to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-800 dark:text-gray-100">
            {!hasJoined ? (
                <div className="flex flex-col gap-5 w-full max-w-md mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6">
                    {/* Success Badge */}
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-green-600 text-sm font-medium">Room Verified</span>
                    </div>

                    <h1 className="text-2xl font-semibold text-center">🎤 Join Conference</h1>
                    <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                        Room ID: <span className="font-mono text-blue-600 dark:text-blue-400">{roomIdUrl}</span>
                    </p>

                    {/* Email Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Email Address *
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                            <input
                                type="email"
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                aria-label="Enter your email"
                                required
                            />
                        </div>
                    </div>

                    {/* Name Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Display Name *
                        </label>
                        <input
                            type="text"
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter your name"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            aria-label="Enter your name"
                            required
                        />
                    </div>

                    <button
                        className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-all text-lg font-medium flex items-center justify-center gap-2"
                        onClick={joinRoom}
                        disabled={!username.trim() || !email.trim() || isValidating}
                    >
                        {isValidating ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Validating...
                            </>
                        ) : (
                            <>
                                <Video className="w-5 h-5" />
                                Join Room
                            </>
                        )}
                    </button>

                    {/* Room Info */}
                    {roomDetails && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-sm">
                            <p className="text-blue-800 dark:text-blue-300">
                                <strong>Meeting:</strong> {roomDetails.name || 'Conference Room'}
                            </p>
                            {roomDetails.scheduledTime && (
                                <p className="text-blue-700 dark:text-blue-400 mt-1">
                                    <strong>Scheduled:</strong> {new Date(roomDetails.scheduledTime).toLocaleString()}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <>
                    <h1 className="text-2xl font-bold mb-6 text-center">
                        🎥 Conference Room: <span className="text-blue-500">{roomId}</span>
                    </h1>

                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Local stream */}
                        <div className="flex flex-col gap-4 items-center">
                            <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-md">
                                {isRecording && (
                                    <p className="absolute top-2 right-3 text-sm text-red-500 animate-pulse">
                                        🔴 Recording
                                    </p>
                                )}
                                <h2 className="text-lg font-semibold mb-2">Local Stream</h2>
                                <video
                                    ref={localVideoRef}
                                    autoPlay
                                    muted
                                    className="w-[480px] h-[360px] rounded-lg border border-gray-300 dark:border-gray-700 shadow-inner object-cover"
                                    style={{ transform: "scaleX(-1)" }}
                                />
                                <p className="text-center mt-2 font-medium text-gray-700 dark:text-gray-300">{username}</p>
                            </div>

                            {/* Controls */}
                            <div className="flex gap-4 justify-center mt-2">
                                <button
                                    onClick={audioHandler}
                                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                >
                                    {isAudioMuted ? "🎙️ Unmute" : "🔇 Mute"}
                                </button>
                                <button
                                    onClick={videoHandler}
                                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                >
                                    {isVideoMuted ? "📷 Turn On" : "📴 Turn Off"}
                                </button>
                                <button
                                    onClick={shareScreen}
                                    disabled={!!screenStream}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${screenStream
                                        ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700"
                                        : "bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border dark:border-gray-600"
                                        }`}
                                >
                                    {screenStream ? "🖥️ Sharing" : "📺 Share Screen"}
                                </button>
                                <button onClick={disconnect} disabled={isLeavingRoom}>
                                    {isLeavingRoom ? "leaving..." : "Leave Room"}
                                </button>

                            </div>
                        </div>

                        {/* Remote streams */}
                        <div className="flex-1">
                            <h2 className="text-lg font-semibold mb-3">Remote Streams ({remoteStreams.length})</h2>
                            <div className="flex flex-wrap gap-4">
                                {remoteStreams.length > 0 ? (
                                    remoteStreams.map(({ id, stream, username }) => (
                                        <div className="flex flex-col items-center bg-white border-white dark:bg-gray-900 p-2 rounded-lg shadow-sm" key={id}>
                                            {stream.getVideoTracks()[0] && (
                                                <>
                                                    <video
                                                        key={id}
                                                        autoPlay
                                                        playsInline
                                                        className="w-[320px] h-[240px] rounded border border-gray-300 dark:border-gray-700 bg-black object-cover"
                                                        ref={(video) => {
                                                            if (video && video.srcObject !== stream) {
                                                                video.srcObject = stream;
                                                            }
                                                        }}
                                                    />
                                                    <p className="mt-1 font-medium text-sm">{username}</p>
                                                </>
                                            )}
                                            <audio
                                                key={`audio-${id}`}
                                                autoPlay
                                                hidden
                                                playsInline
                                                muted={false}
                                                ref={(audio) => {
                                                    if (audio && audio.srcObject !== stream) {
                                                        audio.srcObject = stream;
                                                    }
                                                }}
                                            />
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 dark:text-gray-400">No remote streams yet</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Screen sharing section */}
                    {screenStream && (
                        <div className="mt-8 bg-white dark:bg-gray-900 p-4 rounded-xl shadow-md">
                            <h2 className="text-lg font-semibold mb-2">🔄 Screen Sharing</h2>
                            <video
                                autoPlay
                                muted
                                playsInline
                                className="w-full max-w-[720px] h-[360px] border border-gray-300 dark:border-gray-700 rounded-lg object-cover"
                                ref={(video) => {
                                    if (video && video.srcObject !== screenStream) {
                                        video.srcObject = screenStream;
                                    }
                                }}
                            />
                            <button
                                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                                onClick={stopScreenShare}
                            >
                                Stop Sharing
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
