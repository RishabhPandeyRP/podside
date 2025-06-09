"use client";
import React, { useEffect, useRef, useState } from "react";
import { Device } from "mediasoup-client";
import io from "socket.io-client";

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


    const joinRoom = async () => {
        if (!username || !roomId) return alert("Please enter username and room");

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
                    //@ts-ignore
                    (data) => {
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

            const stream = new MediaStream([consumer.track]);
            console.log("Consumer track kind:", consumer.track.kind);
            console.log("Track readyState:", consumer.track.readyState);
            console.log("Stream tracks:", stream.getTracks());
            console.log("Stream has video tracks:", stream.getVideoTracks().length > 0);


            if (consumer.kind === "video" && stream.getTracks().length > 0) {
                //@ts-ignore
                setRemoteStreams((prev) => [...prev, { id: producerId, stream, username: consumerData.username }]);
            }

            if (consumer.kind !== 'video') {
                console.warn("⚠️ Skipping non-video consumer:", consumer.kind);
                return;
            }


            //@ts-ignore
            console.log(`Consumed consumerId : ${consumerData.id} , producerId : ${producerId} , username : ${consumerData.username}`)
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

        // stream.getTracks().forEach((track) => {
        //     sendTransport.produce({ track });
        // });

        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
            const producer = await sendTransport.produce({ track: videoTrack });
            ownProducerId.current?.add(producer.id);
            console.log("✅ Video track produced:", videoTrack);
            console.log("🎥 Producing track:", videoTrack);
            console.log("🎥 readyState:", videoTrack.readyState);
            console.log("🎥 enabled:", videoTrack.enabled);
            console.log("🎥 muted:", videoTrack.muted);

            videoTrack.onmute = () => console.warn("🔇 Local video track muted");
            videoTrack.onunmute = () => console.log("🔊 Local video track unmuted");
        } else {
            console.warn("⚠️ No video track available for production");
        }





        socket.on("new-producer", async ({ producerId }) => {
            try {
                if (!device.loaded) return;
                console.log("new producer : ", producerId);
                await consumeRemote(producerId);
            } catch (err) {
                console.error("Failed to consume new producer:", err);
            }
        });

        socket.on("producer-closed", ({ producerId }) => {
            console.log("🚫 Remote producer closed:", producerId);

            setRemoteStreams((prev) => {
                const updated = prev.filter((item) => item.id !== producerId);
                const removed = prev.find((item) => item.id === producerId);
                removed?.stream.getTracks().forEach((track) => track.stop());
                return updated;
            });

            consumedProducerIds.current.delete(producerId);
        });

        // setHasJoined(true);
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



    return (
        <div className="p-4">
            {!hasJoined ? (
                <div className="flex flex-col gap-4 w-full max-w-md mx-auto">
                    <h1 className="text-xl font-bold mb-2">🎤 Join Conference</h1>
                    <input
                        className="border p-2 rounded"
                        placeholder="Enter Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <input
                        className="border p-2 rounded"
                        placeholder="Enter Room ID"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                    />
                    <button
                        className="p-3 bg-blue-600 text-white rounded hover:bg-blue-700"
                        onClick={joinRoom}
                    >
                        Join Room
                    </button>
                </div>
            ) : (
                <>
                    <h1 className="text-xl font-bold mb-4">🎥 Video Conference: {roomId}</h1>
                    <div className="flex gap-6 items-center">
                        <div className="flex flex-col ">
                            <div>
                                <h2 className="font-semibold">Local Stream</h2>
                                <video
                                    ref={localVideoRef}
                                    autoPlay
                                    // muted
                                    className="w-[480px] h-[360px] border rounded"
                                    style={{ transform: "scaleX(-1)" }}
                                />
                                <p>{username}</p>
                            </div>
                            <div className="flex gap-5 items-center h-[100px] w-full justify-center">
                                <button
                                    onClick={audioHandler}
                                    className="border p-4 bg-neutral-100/30 rounded-md cursor-pointer"
                                >
                                    {isAudioMuted ? "unmute" : "mute"}
                                </button>

                                <button
                                    onClick={videoHandler}
                                    className="border p-4 bg-neutral-100/30 rounded-md cursor-pointer"
                                >
                                    {isVideoMuted ? "on-camera" : "off-camera"}
                                </button>

                                <button
                                    onClick={shareScreen}
                                    className="border p-4 bg-neutral-100/30 rounded-md cursor-pointer"
                                    disabled={!!screenStream} // disable if already sharing
                                >
                                    {screenStream ? "Sharing Screen" : "Share Screen"}
                                </button>

                            </div>
                        </div>

                        <div>
                            <h2 className="font-semibold">Remote Streams ({remoteStreams.length})</h2>
                            <div className="flex flex-wrap gap-4">
                                {remoteStreams.map(({ id, stream, username }) => (
                                    <div className="flex flex-col" key={id}>
                                        <video
                                            key={id}
                                            autoPlay
                                            muted
                                            playsInline
                                            className="w-[320px] h-[240px] border rounded bg-black"
                                            ref={(video) => {
                                                console.log("🔥 Ref callback invoked", video, stream);
                                                if (video) {
                                                    if (video.srcObject !== stream) {
                                                        video.srcObject = stream;
                                                    }

                                                    const videoTrack = stream.getVideoTracks()[0];
                                                    if (videoTrack) {
                                                        console.log("🧪 Remote video track readyState:", videoTrack.readyState);
                                                        console.log("🧪 Remote video track muted:", videoTrack.muted);
                                                        console.log("🧪 Remote video track enabled:", videoTrack.enabled);

                                                        videoTrack.onmute = () => console.warn("🚫 Remote video track muted");
                                                        videoTrack.onunmute = () => console.log("✅ Remote video track unmuted");
                                                    } else {
                                                        console.warn("⚠️ No video track found in remote stream");
                                                    }
                                                    video
                                                        .play()
                                                        .then(() => console.log(`✅ Playing remote stream: ${id}`))
                                                        .catch((err) =>
                                                            console.error(`❌ Error playing remote stream (${id}):`, err)
                                                        );
                                                }
                                            }}
                                        />
                                        <p>{username}</p>
                                    </div>
                                ))}
                                {remoteStreams.length === 0 && <p>No remote streams yet</p>}
                            </div>
                        </div>
                    </div>


                    {screenStream && (
                        <div>
                            <h2 className="font-semibold">Screen Sharing</h2>
                            <video
                                autoPlay
                                muted
                                playsInline
                                className="w-[480px] h-[360px] border rounded"
                                ref={(video) => {
                                    if (video && video.srcObject !== screenStream) {
                                        video.srcObject = screenStream;
                                    }
                                }}
                            />
                            <button
                                className="mt-2 p-2 bg-red-600 text-white rounded"
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
