"use client"
import React from "react"
import { useState } from "react"
import { apiRequest } from "../../lib/api"
import { Video } from "lucide-react"
import RoomForm from "../../components/create-room/RoomForm"
import Router from "next/router"
import { redirect } from "next/navigation"

const CreateRoom = () => {
    const [roomUrl, setRoomUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false)
    const [copied, setCopied] = useState<boolean>(false)
    const [roomName, setRoomName] = useState<string>("")
    const [scheduledTime, setScheduledTime] = useState<string>("")
    const [creatorEmail, setCreatorEmail] = useState<string>("")
    const [participants, setParticipants] = useState<string[]>([])
    const [newParticipantEmail, setNewParticipantEmail] = useState<string>("")
    const [emailError, setEmailError] = useState<string>("")
    // const router = Router();


    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const addParticipant = () => {
        const email = newParticipantEmail.trim();

        if (!email) {
            setEmailError("Please enter an email address");
            return;
        }

        if (!validateEmail(email)) {
            setEmailError("Please enter a valid email address");
            return;
        }

        if (participants.includes(email)) {
            setEmailError("This email is already added");
            return;
        }

        if (email === creatorEmail) {
            setEmailError("Creator email will be included automatically");
            return;
        }

        setParticipants([...participants, email]);
        setNewParticipantEmail("");
        setEmailError("");
    };

    const removeParticipant = (emailToRemove: string) => {
        setParticipants(participants.filter(email => email !== emailToRemove));
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addParticipant();
        }
    };


    const createRoomHandler = async () => {
        if (!creatorEmail.trim()) {
            setEmailError("Creator email is required");
            return;
        }

        if (!validateEmail(creatorEmail)) {
            setEmailError("Please enter a valid creator email");
            return;
        }
        try {
            setLoading(true);
            setEmailError("");

            const payload = {
                roomName: roomName,
                creatorEmail: creatorEmail,
                participantEmails: participants
            }

            const data = await apiRequest("/room", "POST", payload) as { roomId: string, link: string };

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
            // window.open(roomUrl, '_blank');
            // Router.push(roomUrl);
            redirect(roomUrl);
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

    const resetForm = () => {
        setRoomUrl(null);
        setRoomName("");
        setScheduledTime("");
        setCreatorEmail("");
        setParticipants([]);
        setNewParticipantEmail("");
        setEmailError("");
        setCopied(false);
    };

    return (
        <div className="min-h-screen bg-[#151515] flex items-center justify-center p-0 border-0 border-red-500">
            <div className="w-fit border-0 border-red-500 -mt-[5%]">
                {/* Header */}
                {/* <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                        <Video className="w-8 h-8 text-blue-600" />
                    </div>
                    <h1 className="text-2xl font-semibold text-gray-900 mb-2">Start a Meeting</h1>
                    <p className="text-gray-600">Create a secure room for your video conference</p>
                </div> */}

                {/* Main Card */}
                <div className="bg-[#151515] rounded-2xl shadow-lg border-0 border-gray-100 p-6 space-y-6 w-fit">
                    <RoomForm
                        roomUrl={roomUrl}
                        setRoomUrl={setRoomUrl}
                        loading={loading}
                        setLoading={setLoading}
                        copied={copied}
                        setCopied={setCopied}
                        roomName={roomName}
                        setRoomName={setRoomName}
                        scheduledTime={scheduledTime}
                        setScheduledTime={setScheduledTime}
                        creatorEmail={creatorEmail}
                        setCreatorEmail={setCreatorEmail}
                        participants={participants}
                        setParticipants={setParticipants}
                        newParticipantEmail={newParticipantEmail}
                        setNewParticipantEmail={setNewParticipantEmail}
                        emailError={emailError}
                        setEmailError={setEmailError}
                        copyingHandler={copyingHandler}
                        joinMeetingHandler={joinMeetingHandler}
                        shareHandler={shareHandler}
                        resetForm={resetForm}
                        handleKeyPress={handleKeyPress}
                        addParticipant={addParticipant}
                        removeParticipant={removeParticipant}
                        createRoomHandler={createRoomHandler}
                    />
                </div>
            </div>
        </div>
    )
}

export default CreateRoom