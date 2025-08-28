import React from "react"
import { useMemo } from "react";
import { Mic, MicOff, Video, VideoOff, MonitorUp, PhoneOff } from "lucide-react";
import { Device } from "mediasoup-client";
import StreamLayout from "./StreamLayout";

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

    remoteVideoMuted: Record<string, boolean>;
    remoteAudioMuted: Record<string, boolean>;

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

const generateShinyColor = () => {
    const shinyColors = [
        // Vibrant purples
        '#8B5CF6', '#A855F7', '#9333EA', '#7C3AED', '#6D28D9',
        // Electric blues
        '#3B82F6', '#2563EB', '#1D4ED8', '#1E40AF', '#06B6D4',
        // Emerald greens
        '#10B981', '#059669', '#047857', '#065F46', '#22C55E',
        // Bright pinks
        '#EC4899', '#DB2777', '#BE185D', '#F472B6', '#E879F9',
        // Golden yellows
        '#F59E0B', '#D97706', '#B45309', '#FBBF24', '#FCD34D',
        // Coral/Orange
        '#F97316', '#EA580C', '#DC2626', '#EF4444', '#F87171',
        // Teal/Cyan
        '#14B8A6', '#0D9488', '#0F766E', '#06B6D4', '#67E8F9',
        // Indigo
        '#6366F1', '#4F46E5', '#4338CA', '#3730A3', '#818CF8'
    ];

    return shinyColors[Math.floor(Math.random() * shinyColors.length)];
};

// Function to generate a complementary darker shade for overlay
const generateOverlayColor = (baseColor: string) => {
    // Convert hex to RGB
    const hex = baseColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Create darker version for overlay
    const darkerR = Math.floor(r * 0.3);
    const darkerG = Math.floor(g * 0.3);
    const darkerB = Math.floor(b * 0.3);

    return `rgb(${darkerR}, ${darkerG}, ${darkerB})`;
};



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
    localStream,
    stopScreenShare,
    disconnect,
    audioHandler,
    remoteVideoMuted,
    remoteAudioMuted,
    videoHandler

}: Partial<ConferenceInterface>) => {

    // At the top of your ConferenceScreen component
    const remoteColorMap = useMemo(() => {
        const map: Record<string, { main: string; overlay: string }> = {};
        remoteStreams?.forEach(({ id }) => {
            // Use id as the key for consistency
            const main = generateShinyColor() || "#8B5CF6"; // Fallback to a default color if needed
            const overlay = generateOverlayColor(main);
            map[id] = { main, overlay };
        });
        return map;
    }, [remoteStreams]);


    console.log("Remote Streams:", remoteStreams);

    return (
        <div className="flex flex-col justify-between gap-5 p-2 bg-[#151515] rounded-lg shadow-lg mx-auto border-0 border-green-500 w-[100%] h-[90%]">

            <StreamLayout
                localStream={localStream}
                localVideoRef={localVideoRef}
                username={username}
                isVideoMuted={isVideoMuted}
                isAudioMuted={isAudioMuted}
                remoteStreams={remoteStreams}
                remoteAudioMuted={remoteAudioMuted}
                remoteVideoMuted={remoteVideoMuted}
                remoteColorMap={remoteColorMap}
            />

            {/* Controls */}
            <div className="flex gap-4 justify-center items-center border-0 ">
                <button
                    onClick={audioHandler}
                    className="flex items-center gap-2 px-3 py-3 rounded-lg hover:bg-[#292929] transition-all duration-100 bg-[#222222] text-sm"
                >
                    {!isAudioMuted ? <Mic></Mic> : <MicOff className="text-red-400 text-sm"></MicOff>}
                </button>
                <button
                    onClick={videoHandler}
                    className="flex items-center gap-2 px-3 py-3 rounded-lg hover:bg-[#292929] transition-all duration-100 bg-[#222222]"
                >
                    {!isVideoMuted ? <Video></Video> : <VideoOff className="text-red-400"></VideoOff>}
                </button>
                <button
                    onClick={shareScreen}
                    disabled={!!screenStream}
                    className={`flex items-center gap-2 px-3 py-3 rounded-lg transition-all duration-100 ${!screenStream
                        ? "bg-[#222222] hover:bg-[#292929]"
                        : "bg-[#9966CC] hover:bg-[#9966ccb8]"
                        }`}
                >
                    {screenStream ? <MonitorUp></MonitorUp> : <MonitorUp></MonitorUp>}
                </button>
                <button
                    onClick={disconnect}
                    disabled={isLeavingRoom}
                    className="flex items-center gap-2 px-3 py-3 rounded-lg hover:bg-[#322424] transition-all duration-100 bg-[#2a1e1e] disabled:cursor-not-allowed disabled:bg-[#2a1e1e] text-red-400"
                >
                    {isLeavingRoom ? <PhoneOff></PhoneOff> : <PhoneOff></PhoneOff>}
                </button>

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
        </div>
    )
}

export default ConferenceScreen