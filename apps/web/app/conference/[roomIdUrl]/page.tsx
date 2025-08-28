"use client";
import React, { useEffect, useRef, useState } from "react";
import { Device } from "mediasoup-client";
import io from "socket.io-client";
import { openDB } from 'idb';
import { toast } from 'react-hot-toast';
import { useParams } from 'next/navigation';
import { useSearchParams } from "next/navigation";
import { apiRequest } from "../../../lib/api";
import RedirectScreen from "../../../components/conference/RedirectScreen";
import ValidationScreen from "../../../components/conference/ValidationScreen";
import ErrorValidationScreen from "../../../components/conference/ErrorValidationScreen";
import JoiningScreen from "../../../components/conference/JoiningScreen";
import ConferenceScreen from "../../../components/conference/ConferenceScreen";

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
    const videoProducerId = useRef<string | null>(null);
    const audioProducerId = useRef<string | null>(null);

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
    const [remoteVideoMuted, setRemoteVideoMuted] = useState<Record<string, boolean>>({});
    const [remoteAudioMuted, setRemoteAudioMuted] = useState<Record<string, boolean>>({});


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

    useEffect(() => {
    function handlePeerVideoMuted({ producerId }:{producerId: string}) {
        console.log("Peer video muted:", producerId);
        setRemoteVideoMuted(prev => ({ ...prev, [producerId]: true }));
    }
    function handlePeerVideoUnmuted({ producerId }:{producerId: string}) {
        setRemoteVideoMuted(prev => ({ ...prev, [producerId]: false }));
    }
    function handlePeerAudioMuted({ producerId }:{producerId: string}) {
        console.log("Peer audio muted:", producerId);
        setRemoteAudioMuted(prev => ({ ...prev, [producerId]: true }));
    }
    function handlePeerAudioUnmuted({ producerId }:{producerId: string}) {
        setRemoteAudioMuted(prev => ({ ...prev, [producerId]: false }));
    }

    socket.on("peer-video-muted", handlePeerVideoMuted);
    socket.on("peer-video-unmuted", handlePeerVideoUnmuted);
    socket.on("peer-audio-muted", handlePeerAudioMuted);
    socket.on("peer-audio-unmuted", handlePeerAudioUnmuted);

    return () => {
        socket.off("peer-video-muted", handlePeerVideoMuted);
        socket.off("peer-video-unmuted", handlePeerVideoUnmuted);
        socket.off("peer-audio-muted", handlePeerAudioMuted);
        socket.off("peer-audio-unmuted", handlePeerAudioUnmuted);
    };
}, []);

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
            if(kind === 'video') {
                videoProducerId.current = id;
            }
            if(kind === 'audio') {
                audioProducerId.current = id;
            }
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
        console.log("audio muted hit from ui" , roomId , audioProducerId.current);
        if(!isAudioMuted) socket.emit("audio-muted", { roomId, producerId: audioProducerId.current });
        else socket.emit("audio-unmuted", { roomId, producerId: audioProducerId.current });
        setAudioMuted(!isAudioMuted);
    };

    const videoHandler = () => {
        if (!localStream) return;
        localStream.getVideoTracks().forEach((track) => (track.enabled = isVideoMuted));
        console.log("video muted hit from ui" , roomId , videoProducerId.current);
        if(!isVideoMuted) socket.emit("video-muted", { roomId, producerId: videoProducerId.current });
        else socket.emit("video-unmuted", { roomId, producerId: videoProducerId.current });
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
            debugger;
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
        return <RedirectScreen redirectCountdown={redirectCountdown} setRedirectCountdown={setRedirectCountdown}></RedirectScreen>
    }

    // Render splash screen while validating
    if (isValidating) {
        return <ValidationScreen roomIdUrl={roomIdUrl}></ValidationScreen>
    }

    // Render error screen if room validation failed
    if (!isRoomValid) {
        return <ErrorValidationScreen validationError={validationError} roomIdUrl={roomIdUrl}></ErrorValidationScreen>
    }

    return (
        <div className="p-6 h-screen bg-[#151515] flex items-center justify-center border border-green-500">
            {!hasJoined ? (
                <JoiningScreen
                    roomIdUrl={roomIdUrl}
                    email={email}
                    setEmail={setEmail}
                    username={username}
                    setUsername={setUsername}
                    isValidating={isValidating}
                    roomDetails={roomDetails}
                    joinRoom={joinRoom}>
                </JoiningScreen>
            ) : (
                <ConferenceScreen
                    roomId={roomId}
                    isRecording={isRecording}
                    localVideoRef={localVideoRef}
                    username={username}
                    isAudioMuted={isAudioMuted}
                    isVideoMuted={isVideoMuted}
                    shareScreen={shareScreen}
                    screenStream={screenStream}
                    isLeavingRoom={isLeavingRoom}
                    remoteStreams={remoteStreams}
                    localStream={localStream}
                    stopScreenShare={stopScreenShare}
                    disconnect={disconnect}
                    audioHandler={audioHandler}
                    remoteVideoMuted={remoteVideoMuted}
                    remoteAudioMuted={remoteAudioMuted}
                    videoHandler={videoHandler}>
                </ConferenceScreen>
            )}
        </div>
    );
}
