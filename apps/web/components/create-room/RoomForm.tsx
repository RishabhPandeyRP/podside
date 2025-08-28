import React from "react";
import { Copy, Video, Users, Share2, CheckCircle, Clock, Mail, X, Plus, UserCheck, } from "lucide-react"
import CheckDevices from "./CheckDevices";

interface RoomStateContext {
    roomUrl: string | null;
    setRoomUrl: React.Dispatch<React.SetStateAction<string | null>>;

    loading: boolean;
    setLoading: React.Dispatch<React.SetStateAction<boolean>>;

    copied: boolean;
    setCopied: React.Dispatch<React.SetStateAction<boolean>>;

    roomName: string;
    setRoomName: React.Dispatch<React.SetStateAction<string>>;

    scheduledTime: string;
    setScheduledTime: React.Dispatch<React.SetStateAction<string>>;

    creatorEmail: string;
    setCreatorEmail: React.Dispatch<React.SetStateAction<string>>;

    participants: string[];
    setParticipants: React.Dispatch<React.SetStateAction<string[]>>;

    newParticipantEmail: string;
    setNewParticipantEmail: React.Dispatch<React.SetStateAction<string>>;

    emailError: string;
    setEmailError: React.Dispatch<React.SetStateAction<string>>;

    copyingHandler: () => void;
    joinMeetingHandler: () => void;
    shareHandler: () => void;
    resetForm: () => void;
    handleKeyPress: (e: React.KeyboardEvent) => void;
    addParticipant: () => void;
    removeParticipant: (email: string) => void;
    createRoomHandler: () => void;
}

const RoomForm = ({ roomUrl, setRoomUrl,
    loading, setLoading,
    copied, setCopied,
    roomName, setRoomName,
    scheduledTime, setScheduledTime,
    creatorEmail, setCreatorEmail,
    participants, setParticipants,
    newParticipantEmail, setNewParticipantEmail,
    emailError, setEmailError,
    copyingHandler,
    joinMeetingHandler,
    shareHandler,
    resetForm,
    handleKeyPress,
    addParticipant,
    removeParticipant,
    createRoomHandler
}: RoomStateContext) => {
    if (!roomUrl) {
        return (
            <>
                {/* Meeting Details Form */}
                <div className="space-y-6">
                    {/* Meeting Name */}
                    <div className="mb-14">
                        {/* <label className="block text-sm font-medium text-gray-700 mb-2">
                            Meeting Name (Optional)
                        </label> */}
                        <input
                            type="text"
                            value={roomName}
                            onChange={(e) => setRoomName(e.target.value)}
                            placeholder="Meeting Name"
                            className="w-full px-4 py-3 border-b border-gray-200 outline-none transition-all duration-200 text-white text-4xl font-extrabold placeholder-neutral-500"
                        />
                    </div>

                    {/* Creator Email */}
                    <div className="text-[#f3f3f3]">
                        <label className="block text-sm font-medium mb-1">
                            Creator Email *
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                            <input
                                type="email"
                                value={creatorEmail}
                                onChange={(e) => {
                                    setCreatorEmail(e.target.value);
                                    if (emailError) setEmailError("");
                                }}
                                placeholder="your.email@example.com"
                                className="w-full pl-10 pr-4 py-3 rounded-lg  outline-none transition-all duration-200 text-white bg-[#222222] placeholder-neutral-500"
                                required
                            />
                        </div>
                    </div>

                    {/* Participants Section */}
                    <div className="text-[#f3f3f3]">
                        <label className="block text-sm font-medium mb-2">
                            Authorized Participants (Optional)
                        </label>


                        {/* Add Participant Input */}
                        <div className="flex gap-2 mb-3">
                            <div className="flex-1 relative">
                                <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                <input
                                    type="email"
                                    value={newParticipantEmail}
                                    onChange={(e) => {
                                        setNewParticipantEmail(e.target.value);
                                        if (emailError) setEmailError("");
                                    }}
                                    onKeyPress={handleKeyPress}
                                    placeholder="participant@example.com"
                                    className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-[#222222] outline-none transition-all duration-100 text-sm  placeholder-neutral-500 focus:bg-[#292929]"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={addParticipant}
                                className="px-3 py-2.5 bg-[#222222] hover:bg-[#292929] text-[#f3f3f3] rounded-lg transition-colors duration-200 flex items-center gap-1"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Error Message */}
                        {emailError && (
                            <p className="text-red-500 text-xs mb-3">{emailError}</p>
                        )}

                        {/* Participants List */}
                        {participants.length > 0 && (
                            <div className="space-y-2 max-h-32 overflow-y-auto bg-[#222222] p-5 rounded-lg">
                                <p className="text-xs mb-3">
                                    Only these email addresses will be able to join the room
                                </p>
                                {participants.map((email, index) => (
                                    <div key={index} className="flex items-center justify-between bg-[#292929] px-3 py-2 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <UserCheck className="w-4 h-4 text-green-600" />
                                            <span className="text-sm text-[#f3f3f3]">{email}</span>
                                        </div>
                                        <button
                                            onClick={() => removeParticipant(email)}
                                            className="text-gray-400 hover:text-red-500 transition-colors duration-200"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Scheduled Time */}
                    {/* <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Schedule for Later (Optional)
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={scheduledTime}
                                        onChange={(e) => setScheduledTime(e.target.value)}
                                        min={getCurrentDateTime()}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 text-black"
                                    />
                                </div> */}
                </div>

                {/* Create Button */}
                <button
                    onClick={createRoomHandler}
                    disabled={loading}
                    className="w-full bg-[#9966CC] hover:bg-[#9966cce5] disabled:bg-[#9966ccb7] text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 group"
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
                <div className="bg-[#222222] rounded-lg p-4 text-[#b5b5b5]">
                    <div className="flex items-start gap-3">
                        <div className="relative w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                            {/* Animated growing & blurred white circle */}
                            <div className="absolute w-5 h-5 rounded-full bg-white opacity-20 blur-md  flex items-center justify-center"></div>

                            {/* Static circle */}

                            <div className="w-2 h-2 bg-blue-600 rounded-full" />

                        </div>



                        <div className="text-sm ">
                            <p className="font-medium mb-1">Secure Access</p>
                            <p>Only you and authorized participants can join this room. Leave participants empty for an open room.</p>
                        </div>
                    </div>
                </div>
            </>
        )
    } else {
        return (
            <div className="flex border-0 border-red-200 justify-between items-center">
                <div className="w-[48%] flex flex-col gap-6">
                    {/* Success State */}
                    <div className="">
                        <h3 className="text-2xl font-semibold">Join Room {roomName}</h3>
                        <p className="text-gray-400 text-sm">
                            You are joining as a host
                        </p>
                    </div>

                    {/* Room URL Display */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-[#f3f3f3]">
                            Meeting Link
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                readOnly
                                value={roomUrl}
                                className="flex-1 px-4 py-3 rounded-lg text-sm font-mono  outline-none transition-all duration-200 text-white bg-[#222222] placeholder-neutral-500"
                            />
                            <button
                                onClick={copyingHandler}
                                className="px-4 py-3 bg-[#222222] hover:bg-[#303030] text-gray-300 rounded-lg transition-colors duration-200 flex items-center gap-2"
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
                            className="flex-1 bg-[#9966CC] hover:bg-[#9966cce5] text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                        >
                            <Video className="w-4 h-4" />
                            Join Now
                        </button>
                        <button
                            onClick={shareHandler}
                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                        >
                            <Share2 className="w-4 h-4" />
                            Invite
                        </button>
                    </div>

                    {/* Meeting Info */}
                    <div className="bg-[#222222] rounded-lg p-4 space-y-3">
                        {/* Creator */}
                        <div className="flex items-center gap-2 text-sm text-[#f2f2f2]">
                            <Mail className="w-4 h-4 text-yellow-300" />
                            <span>Created by : {creatorEmail}</span>
                        </div>

                        {/* Meeting Name */}
                        {/* {roomName && (
                        <div className="flex items-center gap-2 text-sm text-[#f2f2f2]">
                            <Users className="w-4 h-4" />
                            <span>{roomName}</span>
                        </div>
                    )} */}

                        {/* Participants */}
                        {participants.length > 0 && (
                            <div className="text-sm text-[#f2f2f2]">
                                <div className="flex items-center gap-2 mb-2">
                                    <UserCheck className="w-4 h-4 text-green-300" />
                                    <span>Authorized Participants ({participants.length})</span>
                                </div>
                                <div className="ml-6 space-y-1 max-h-20 overflow-y-auto">
                                    {participants.map((email, index) => (
                                        <div key={index} className="text-xs text-[#f2f2f2]">
                                            • {email}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Scheduled Time */}
                        {scheduledTime && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Clock className="w-4 h-4" />
                                <span>Scheduled for {new Date(scheduledTime).toLocaleString()}</span>
                            </div>
                        )}
                    </div>

                    {/* New Meeting Button */}
                    <div className="flex">
                        <button
                            onClick={resetForm}
                            className=" mx-auto text-gray-300 hover:text-gray-400 font-medium py-2 transition-colors duration-100"
                        >
                            Create Another Room
                        </button>
                    </div>

                </div>

                <div className="w-[45%]">
                    <CheckDevices></CheckDevices>
                </div>


            </div>

        )
    }
}

export default RoomForm;