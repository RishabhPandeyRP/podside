"use client"
import React from "react"
import { useState } from "react"
import { apiRequest } from "../../lib/api"
import { Copy, Video, Users, Share2, CheckCircle, Clock } from "lucide-react"

const CreateRoom = () => {
    const [roomUrl, setRoomUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false)
    const [copied, setCopied] = useState<boolean>(false)
    const [roomName, setRoomName] = useState<string>("")
    const [scheduledTime, setScheduledTime] = useState<string>("")
    

    const createRoomHandler = async () => {
        try {
            setLoading(true);
            const data = await apiRequest("/create-room", "POST", { 
                name: roomName || "Quick Meeting",
                scheduledTime 
            }) as { roomId: string, link: string };

            if (data?.link) {
                setRoomUrl(data.link);
            } else {
                throw new Error("Invalid room data");
            }
        } catch (error) {
            console.error(error);
            alert("Some error occurred while creating the room.");
        } finally {
            setLoading(false);
        }
    };

    const joinMeetingHandler = () => {
        if (roomUrl) {
            // Mock router push - replace with your actual router
            window.open(roomUrl, '_blank');
            // router.push(roomUrl)
        }
    };

    const copyingHandler = async () => {
        if (roomUrl) {
            await window.navigator.clipboard.writeText(roomUrl)
            setCopied(true)

            setTimeout(() => {
                setCopied(false)
            }, 2000)
        }
    }

    const shareHandler = async () => {
        if (roomUrl && navigator.share) {
            try {
                await navigator.share({
                    title: `Join my ${roomName || 'meeting'}`,
                    text: 'Join this video conference',
                    url: roomUrl,
                });
            } catch (error) {
                copyingHandler(); // Fallback to copy
            }
        } else {
            copyingHandler();
        }
    }

    const getCurrentDateTime = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                        <Video className="w-8 h-8 text-blue-600" />
                    </div>
                    <h1 className="text-2xl font-semibold text-gray-900 mb-2">Start a Meeting</h1>
                    <p className="text-gray-600">Create a secure room for your video conference</p>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-6">
                    {!roomUrl ? (
                        <>
                            {/* Meeting Details Form */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Meeting Name (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={roomName}
                                        onChange={(e) => setRoomName(e.target.value)}
                                        placeholder="Quick Meeting"
                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 text-black"
                                    />
                                </div>

                                {/* <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Schedule for Later (Optional)
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={scheduledTime}
                                        onChange={(e) => setScheduledTime(e.target.value)}
                                        min={getCurrentDateTime()}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                                    />
                                </div> */}
                            </div>

                            {/* Create Button */}
                            <button
                                onClick={createRoomHandler}
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 group"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Creating Room...
                                    </>
                                ) : (
                                    <>
                                        <Users className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                        Create Room
                                    </>
                                )}
                            </button>

                            {/* Quick Start Info */}
                            <div className="bg-blue-50 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <div className="w-2 h-2 bg-blue-600 rounded-full" />
                                    </div>
                                    <div className="text-sm text-blue-800">
                                        <p className="font-medium mb-1">Quick Start</p>
                                        <p>Your meeting room will be created instantly. Share the link with participants to join.</p>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Success State */}
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                                    <CheckCircle className="w-6 h-6 text-green-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">Room Created!</h3>
                                <p className="text-gray-600 text-sm">
                                    {roomName || "Your meeting"} is ready to join
                                </p>
                            </div>

                            {/* Room URL Display */}
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-gray-700">
                                    Meeting Link
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        readOnly
                                        value={roomUrl}
                                        className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono text-gray-800 focus:outline-none"
                                    />
                                    <button
                                        onClick={copyingHandler}
                                        className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200 flex items-center gap-2"
                                        title="Copy link"
                                    >
                                        {copied ? (
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                        ) : (
                                            <Copy className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={joinMeetingHandler}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                                >
                                    <Video className="w-4 h-4" />
                                    Join Now
                                </button>
                                <button
                                    onClick={shareHandler}
                                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                                >
                                    <Share2 className="w-4 h-4" />
                                    Share
                                </button>
                            </div>

                            {/* Meeting Info */}
                            {(roomName || scheduledTime) && (
                                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                    {roomName && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Users className="w-4 h-4" />
                                            <span>{roomName}</span>
                                        </div>
                                    )}
                                    {scheduledTime && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Clock className="w-4 h-4" />
                                            <span>Scheduled for {new Date(scheduledTime).toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* New Meeting Button */}
                            <button
                                onClick={() => {
                                    setRoomUrl(null);
                                    setRoomName("");
                                    setScheduledTime("");
                                    setCopied(false);
                                }}
                                className="w-full text-gray-600 hover:text-gray-800 font-medium py-2 transition-colors duration-200"
                            >
                                Create Another Room
                            </button>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="text-center mt-6">
                    <p className="text-xs text-gray-500">
                        Secure • End-to-end encrypted • No downloads required
                    </p>
                </div>
            </div>
        </div>
    )
}

export default CreateRoom