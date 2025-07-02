
import { createRoom, getRoom, leaveParticipant, markParticipantasJoined, updateRoomStatus, validateRoom } from "../services/roomService";
import { setRooms } from "@repo/db/src/state";
import { Request, Response } from "express";

const roomController = {
    createRoom: async (req: Request, res: Response) => {
        const { roomName, creatorEmail, participantEmails } = req.body;

        try {
            const room = await createRoom(roomName, creatorEmail, participantEmails)
            setRooms(room.id)
            const roomUrl = `http://localhost:3000/conference/${room.id}`
            return res.status(200).json({ roomId: room.id, link: roomUrl })
        } catch (error) {
            console.error("Error creating room:", error);
            return res.status(500).json({ message: "Failed to create room" });
        }
    },

    getRoom: async (req: Request, res: Response) => {
        try {
            const room = await getRoom()

            return res.status(200).json({ data: room })
        } catch (error) {
            console.error("Error creating room:", error);
            return res.status(500).json({ message: "Failed to get all rooms" });
        }
    },

    validateRoom: async (req: Request, res: Response) => {
        const { roomId } = req.params;
        const { email } = req.query;

        try {
            const result = await validateRoom(roomId, email as string | undefined);

            if (!result.success) {
                return res.status(200).json({ message: result.message });
            }

            return res.status(200).json({
                message: result.message,
                room: result.room,
            });
        } catch (error) {
            console.error("Validation error:", error);
            return res.status(500).json({ error: "Internal server error" });
        }
    },

    joinParticipant: async (req: Request, res: Response) => {
        try {
            const { email, roomId } = req.body;

            if (!email || !roomId) {
                return res.status(400).json({
                    error: "roomId and email are required"
                })
            }

            const result = await markParticipantasJoined(roomId, email);

            if (!result.success) {
                return res.status(404).json({ error: result.message })
            }

            return res.status(200).json({
                message: result.message,
                participant: result.participant,
            });
        } catch (error) {
            console.error("Error marking participant as joined:", error);
            return res.status(500).json({ error: "Internal server error" });
        }
    },

    roomStatusUpdate: async (req: Request, res: Response) => {
        try {
            const { roomId } = req.params
            const { status } = req.body

            if (status !== "PENDING" && status !== "ACTIVE" && status !== "INACTIVE" && status !== "DELETED") {
                return res.status(400).json({ error: "Incorrect status value" })
            }

            const room = await validateRoom(roomId)

            if (!room.success) {
                return res.status(404).json({ error: "Room not found" })
            }

            const response = await updateRoomStatus(roomId, status)

            if (!response.success) {
                return res.status(404).json({ error: "Cant update the room status" })
            }

            return res.status(200).json({
                message: response.message,
                room: response.room
            })
        } catch (error) {
            console.error("Error updating the room status:", error);
            return res.status(500).json({ error: "Internal server error" });
        }
    },

    leaveParticipant : async(req:Request , res:Response) => {
        try {
            const { roomId } = req.params;
            const { email } = req.query;
            const response = await leaveParticipant(roomId , email as string)

            if(!response.success){
                return res.status(400).json({message : response.message})
            }

            return res.status(200).json({
                participant:response.participant,
                message:response.message
            })

        } catch (error) {
            console.error("error in leave participant")
            return res.status(500).json({message:"Internal server error"})
        }
    }
}

export default roomController;