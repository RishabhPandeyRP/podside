import React from "react";
import { MicOff } from "lucide-react";

// Types for color mapping
interface ColorMap {
    overlay: string;
    main: string;
}

// Types for a remote stream
interface RemoteStream {
    id: string;
    stream: MediaStream;
    username: string | undefined;
}

// Props for VideoTile
interface VideoTileProps {
    id: string;
    stream: MediaStream;
    username: string | undefined;
    isVideoMuted?: boolean;
    isAudioMuted?: boolean;
    color?: ColorMap;
}

// Props for LocalStreamTile
interface LocalStreamTileProps {
    localStream: MediaStream | null | undefined;
    localVideoRef: React.RefObject<HTMLVideoElement | null> | undefined;
    username: string | undefined;
    isVideoMuted?: boolean;
    isAudioMuted?: boolean;
}

// Props for StreamLayout
interface StreamLayoutProps {
    localStream: MediaStream | null | undefined;
    localVideoRef: React.RefObject<HTMLVideoElement | null> | undefined;
    username: string | undefined;
    isVideoMuted?: boolean;
    isAudioMuted?: boolean;
    remoteStreams?: RemoteStream[];
    remoteAudioMuted?: Record<string, boolean>;
    remoteVideoMuted?: Record<string, boolean>;
    remoteColorMap?: Record<string, ColorMap>;
}

// Reusable video/audio tile
const VideoTile = ({
    id,
    stream,
    username,
    isVideoMuted,
    isAudioMuted,
    color = { overlay: "rgba(0,0,0,0.5)", main: "#8B5CF6" }
}: VideoTileProps) => {
    const hasVideo = stream.getVideoTracks().length > 0;
    const hasAudio = stream.getAudioTracks().length > 0;

    return (
        <div key={id} className="relative border-5 border-[#252525] rounded-lg shadow-sm w-full h-full">
            {hasVideo && (
                <video
                    autoPlay
                    playsInline
                    className="w-full h-full rounded object-cover"
                    ref={(video) => {
                        if (video && video.srcObject !== stream) video.srcObject = stream;
                    }}
                />
            )}

            {/* Video muted overlay */}
            {isVideoMuted && (
                <div className="absolute inset-0 flex items-center justify-center z-20" style={{ backgroundColor: color.overlay }}>
                    <div className="text-white text-3xl font-bold flex border p-5 justify-center items-center rounded-full w-16 h-16" style={{ backgroundColor: color.main }}>
                        {(username ?? "")[0]?.toUpperCase()}
                    </div>
                </div>
            )}

            {/* Audio muted icon */}
            {isAudioMuted && (
                <div className="absolute top-3 right-3 z-50 flex items-center gap-2 px-3 py-2 rounded-full">
                    <MicOff className="text-red-400 w-6 h-6" />
                </div>
            )}

            <p className="absolute bottom-4 left-4 font-medium text-white bg-[#3d3d3d13] px-2 py-1 rounded">
                {username}
            </p>

            {/* Hidden audio element */}
            {hasAudio && (
                <audio
                    key={`audio-${id}`}
                    autoPlay
                    playsInline
                    muted={false}
                    ref={(audio) => {
                        if (audio && audio.srcObject !== stream) {
                            audio.srcObject = stream;
                        }
                    }}
                    className="sr-only"
                />
            )}
        </div>
    );
};

// Local video tile
const LocalStreamTile = ({ localStream, localVideoRef, username, isVideoMuted, isAudioMuted }: LocalStreamTileProps) => (
    <div className="relative bg-white border-5 border-[#252525] rounded-xl shadow-md w-full h-full">
        <video
            autoPlay
            muted
            playsInline
            className="w-full h-full rounded-lg object-cover shadow-inner"
            style={{ transform: "scaleX(-1)" }}
            ref={(video) => {
                if (video && localStream && video.srcObject !== localStream) {
                    video.srcObject = localStream;
                }
                if (localVideoRef) {
                    if (typeof localVideoRef === "function") {
                        return localVideoRef
                    } else {
                        localVideoRef.current = video;
                    }
                }
            }}
        />
        {isVideoMuted && (
            <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/50">
                <div className="text-white text-3xl font-bold flex border p-5 justify-center items-center rounded-full w-16 h-16 bg-violet-500">
                    {(username ?? "")[0]?.toUpperCase()}
                </div>
            </div>
        )}
        {isAudioMuted && (
            <div className="absolute top-3 right-3 z-50 flex items-center gap-2 px-3 py-2 rounded-full">
                <MicOff className="text-red-400 w-6 h-6" />
            </div>
        )}
        <p className="absolute bottom-4 left-4 font-medium text-white bg-[#3d3d3d13] px-2 py-1 rounded">
            {username}
        </p>
    </div>
);

const getGridLayout = (totalStreams: number) => {
    if (totalStreams <= 1) return { cols: 1, rows: 1 };
    if (totalStreams <= 2) return { cols: 2, rows: 1 };
    if (totalStreams <= 4) return { cols: 2, rows: 2 };
    if (totalStreams <= 6) return { cols: 3, rows: 2 };
    if (totalStreams <= 9) return { cols: 3, rows: 3 };
    if (totalStreams <= 12) return { cols: 4, rows: 3 };
    if (totalStreams <= 16) return { cols: 4, rows: 4 };
    // For more than 16 streams, use a 5x4 grid and allow scrolling
    return { cols: 5, rows: 4 };
};

// Helper function to get grid CSS classes
const getGridClasses = (cols: number, rows: number) => {
    const colsClass = {
        1: 'grid-cols-1',
        2: 'grid-cols-2',
        3: 'grid-cols-3',
        4: 'grid-cols-4',
        5: 'grid-cols-5'
    }[cols] || 'grid-cols-4';

    const rowsClass = {
        1: 'grid-rows-1',
        2: 'grid-rows-2',
        3: 'grid-rows-3',
        4: 'grid-rows-4'
    }[rows] || 'grid-rows-4';

    return `grid ${colsClass} ${rowsClass}`;
};



// Main layout logic
const StreamLayout = ({
    localStream,
    localVideoRef,
    username,
    isVideoMuted,
    isAudioMuted,
    remoteStreams = [],
    remoteAudioMuted = {},
    remoteVideoMuted = {},
    remoteColorMap = {}
}: StreamLayoutProps) => {
    const remoteCount = remoteStreams.length / 2;
    const totalStreams = remoteCount + 1;

    const remoteAudioStreams = remoteStreams.filter(s => s.stream.getAudioTracks().length > 0).map(({id , stream})=>(
        <audio
            key={`audio-${id}`}
            autoPlay
            playsInline
            muted={false}
            ref={(audio) => {
                if (audio && audio.srcObject !== stream) {
                    audio.srcObject = stream;
                }
            }}
            className="sr-only"
        />
    ));

    // let layoutClass = "flex flex-col lg:flex-row gap-8 w-full";
    // if (count === 0) layoutClass += " h-[88%]";
    // else layoutClass += " h-full";

    const getRemoteTiles = () =>
        remoteStreams.filter(({ stream }) => stream.getVideoTracks().length > 0).map(({ id, stream, username: uname }) => {
            const audioStreamObj = remoteStreams.find(s => s.username === uname && s.stream.getAudioTracks().length > 0);
            const audioStreamId = audioStreamObj?.id;

            return <VideoTile
                key={id}
                id={id}
                stream={stream}
                username={uname}
                isVideoMuted={remoteVideoMuted?.[id]}
                isAudioMuted={remoteAudioMuted?.[audioStreamId || id]}
                color={remoteColorMap?.[id]}
            />
        });


        


    {/* 0 remote streams */ }
    if (remoteCount === 0) {
        return (
            <div className="flex flex-col lg:flex-row gap-8 w-full h-[90%]">
                <div className="w-[85%] h-full mx-auto">
                    <LocalStreamTile {...{ localStream, localVideoRef, username, isVideoMuted, isAudioMuted }} />
                </div>
            </div>
        );
    }

    if (remoteCount === 1) {
        return (
            <div className="flex flex-col lg:flex-row gap-8 w-full h-full">
                <div className="w-[50%] h-full">
                    <LocalStreamTile {...{ localStream, localVideoRef, username, isVideoMuted, isAudioMuted }} />
                </div>
                <div className="w-[50%] h-full flex">{getRemoteTiles()}
                    {remoteAudioStreams}
                </div>
            </div>
        );
    }

    // 2 remote streams - local takes 1/3, remotes take 2/3
    if (remoteCount === 2) {
        return (
            <div className="flex w-full h-full gap-4">
                <div className="w-[33.33%] h-full">
                    <LocalStreamTile {...{ localStream, localVideoRef, username, isVideoMuted, isAudioMuted }} />
                </div>
                <div className="flex gap-4 w-[66.66%]">{getRemoteTiles()}
                {remoteAudioStreams}
                </div>
            </div>
        );
    }

    const { cols, rows } = getGridLayout(totalStreams);
    const gridClasses = getGridClasses(cols, rows);

    // For very large numbers of streams, add scrolling
    const containerClasses = totalStreams > 16
        ? `${gridClasses} gap-4 w-full h-full overflow-y-auto p-4`
        : `${gridClasses} gap-4 w-full h-full`;

    return (
        <div className={containerClasses}>
            <LocalStreamTile {...{ localStream, localVideoRef, username, isVideoMuted, isAudioMuted }} />
            {getRemoteTiles()}
            {remoteAudioStreams}
        </div>
    );

};

export default StreamLayout;
