"use client";
import React, { useEffect, useRef, useState } from "react";
import { Device } from "mediasoup-client";
import io from "socket.io-client";
import { openDB } from 'idb';
import { toast } from 'react-hot-toast';
// import { saveChunk } from './utils/db'; // adjust path


const socket = io("http://localhost:8000",

    { withCredentials: true, transports: ["websocket"] });

export default function Conference() {
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




    // Track unique participants by username
    // const uniqueParticipants = remoteStreams.reduce((acc, stream) => {
    //     if (!acc.find(p => p.username === stream.username)) {
    //         acc.push(stream);
    //     }
    //     return acc;
    // }, [] as typeof remoteStreams);

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




    const joinRoom = async () => {
        if (!username || !roomId) return alert("Please enter username and room");

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

    const disconnect = () => {
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


    return (
        <div className="p-6 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-800 dark:text-gray-100">
            {!hasJoined ? (
                <div className="flex flex-col gap-5 w-full max-w-md mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6">
                    <h1 className="text-2xl font-semibold text-center">🎤 Join Conference</h1>
                    <input
                        className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <input
                        className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter Room ID"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                    />
                    <button
                        className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all text-lg font-medium"
                        onClick={joinRoom}
                    >
                        Join Room
                    </button>
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
                                <button onClick={disconnect}>Leave Room</button>

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
