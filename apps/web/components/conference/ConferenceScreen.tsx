import React from "react"
import { Mail, Video, Shield, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Device } from "mediasoup-client";

interface ConferenceInterface {
    roomIdUrl?: string | string[];
    searchParams: URLSearchParams;

    localVideoRef: React.RefObject<HTMLVideoElement | null>;
    remoteStreams: { id: string; stream: MediaStream; username: string }[];
    setRemoteStreams: React.Dispatch<React.SetStateAction<{ id: string; stream: MediaStream; username: string }[]>>;

    deviceRef: React.RefObject<Device | null>;
    recvTransportRef: React.RefObject<any>;
    consumedProducerIds: React.RefObject<Set<string>>;
    ownProducerId: React.RefObject<Set<string> | null>;

    localStream: MediaStream | null;
    setLocalStream: React.Dispatch<React.SetStateAction<MediaStream | null>>;

    isAudioMuted: boolean;
    setAudioMuted: React.Dispatch<React.SetStateAction<boolean>>;

    isVideoMuted: boolean;
    setVideoMuted: React.Dispatch<React.SetStateAction<boolean>>;

    username: string;
    setUsername: React.Dispatch<React.SetStateAction<string>>;

    roomId: string;
    setRoomId: React.Dispatch<React.SetStateAction<string>>;

    hasJoined: boolean;
    setHasJoined: React.Dispatch<React.SetStateAction<boolean>>;

    screenStream: MediaStream | null;
    setScreenStream: React.Dispatch<React.SetStateAction<MediaStream | null>>;

    screenProducerId: React.RefObject<string | null>;
    sendTransportRef: React.RefObject<any>;

    userInteracted: React.RefObject<boolean>;

    newParticipants: Set<string>;
    setNewParticipants: React.Dispatch<React.SetStateAction<Set<string>>>;

    isRecording: boolean;
    setIsRecording: React.Dispatch<React.SetStateAction<boolean>>;

    isValidating: boolean;
    setIsValidating: React.Dispatch<React.SetStateAction<boolean>>;

    isLeavingRoom: boolean;
    setIsLeaving: React.Dispatch<React.SetStateAction<boolean>>;

    isRoomValid: boolean;
    setIsRoomValid: React.Dispatch<React.SetStateAction<boolean>>;

    validationError: string;
    setValidationError: React.Dispatch<React.SetStateAction<string>>;

    roomDetails: any;
    setRoomDetails: React.Dispatch<React.SetStateAction<any>>;

    email: string;
    setEmail: React.Dispatch<React.SetStateAction<string>>;

    hasLeftRoom: boolean;
    setHasLeftRoom: React.Dispatch<React.SetStateAction<boolean>>;

    redirectCountdown: number;
    setRedirectCountdown: React.Dispatch<React.SetStateAction<number>>;

    joinRoom: () => Promise<void>;
    shareScreen: () => Promise<void>;
    stopScreenShare: () => void;
    disconnect: () => Promise<void>;
    audioHandler: () => void;
    videoHandler: () => void;
}

const ConferenceScreen = ({
    roomId,
    isRecording,
    localVideoRef,
    username,
    isAudioMuted,
    isVideoMuted,
    shareScreen,
    screenStream,
    isLeavingRoom,
    remoteStreams,
    stopScreenShare,
    disconnect,
    audioHandler,
    videoHandler

}: Partial<ConferenceInterface>) => {
    return (
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
                    <h2 className="text-lg font-semibold mb-3">Remote Streams ({remoteStreams?.length})</h2>
                    <div className="flex flex-wrap gap-4">
                        {remoteStreams && remoteStreams.length > 0 ? (
                            remoteStreams?.map(({ id, stream, username }) => (
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
    )
}

export default ConferenceScreen