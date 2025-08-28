import { Mail, Video, Shield, CheckCircle, XCircle, Loader2 } from "lucide-react";
import React from "react";
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

const JoiningScreen = ({
    roomIdUrl,
    email,
    setEmail,
    username,
    setUsername,
    isValidating,
    roomDetails,
    joinRoom
}:Partial<ConferenceInterface>)=>{
    return(
        <div className="flex flex-col gap-6 w-full max-w-lg mx-auto bg-[#151515] rounded-2xl shadow-lg p-6 border-0">
                    {/* Success Badge */}
                    {/* <div className="flex items-center justify-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-green-600 text-sm font-medium">Room Verified</span>
                    </div> */}

                    <h1 className="text-3xl font-semibold text-center text-[#f2f2f2]"> Join Room</h1>
                    {/* <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                        Room ID: <span className="font-mono text-blue-600 dark:text-blue-400">{roomIdUrl}</span>
                    </p> */}

                    {/* Email Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Email Address *
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                            <input
                                type="email"
                                className="w-full pl-10 pr-4 py-3 rounded-lg  outline-none transition-all duration-200 text-white bg-[#222222] placeholder-neutral-500"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail!(e.target.value)}
                                aria-label="Enter your email"
                                required
                            />
                        </div>
                    </div>

                    {/* Name Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Display Name *
                        </label>
                        <input
                            type="text"
                            className="w-full pl-10 pr-4 py-3 rounded-lg  outline-none transition-all duration-200 text-white bg-[#222222] placeholder-neutral-500"
                            placeholder="Enter your name"
                            value={username}
                            onChange={(e) => setUsername!(e.target.value)}
                            aria-label="Enter your name"
                            required
                        />
                    </div>

                    <button
                        className="p-3 bg-[#9966CC] hover:bg-[#9966cce5] text-[#f2f2f2] rounded-xl disabled:bg-[#9966ccb7] disabled:cursor-not-allowed transition-all text-lg font-medium flex items-center justify-center gap-2"
                        onClick={joinRoom}
                        disabled={!username?.trim() || !email?.trim() || isValidating}
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
                    {/* {roomDetails && (
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
                    )} */}
                </div>
    )
}

export default JoiningScreen