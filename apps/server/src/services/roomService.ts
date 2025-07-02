import { prisma } from "@repo/db"
import { ParticipantRole, RoomStatus } from "@repo/db/generated/prisma";

export async function createRoom(roomName: string,
  creatorEmail: string,
  participantEmails: string[]) {
    const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 60 * 1000); // +30 mins

  // Create participants array, including creator
  const participantsData = [
    {
      email: creatorEmail,
      role: ParticipantRole.CREATOR,
      isJoined: true,
      joinedAt: now,
    },
    ...participantEmails
      .filter(email => email !== creatorEmail) // avoid duplicates
      .map(email => ({
        email,
        role: ParticipantRole.GUEST,
        isJoined: false,
      })),
  ];

  const room = await prisma.room.create({
    data: {
      roomName,
      creatorId: creatorEmail,
      status: "PENDING",
      expiresAt,
      participants: {
        create: participantsData,
      },
    },
    include: {
      participants: true,
    },
  });

  return room;
}

export async function validateRoom(roomId: string, email?: string) {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: {
      id: true,
      status: true,
      roomName: true,
      expiresAt: true,
      participants: email
        ? {
            where: { email },
            select: { email: true },
          }
        : undefined,
    },
  });

  if (!room) {
    return {
      success: false,
      message: "Room not found",
    };
  }


  if(room.expiresAt && (new Date(room.expiresAt) < new Date())){
    return {
      success: false,
      message:"Room is expired"
    }
  }

  // If an email is provided, verify authorization
  if (email) {
    const isParticipant = room.participants && room.participants.length > 0;

    if (!isParticipant) {
      return {
        success: false,
        message: "You are not authorized to access this room",
      };
    }

    // Mark participant as joined
    try {
      await markParticipantasJoined(roomId, email);
    } catch (error) {
      console.error("Failed to update participant status:", error);
      return {
        success: false,
        message: "Failed to update participant info",
      };
    }

    // If room is INACTIVE, set to ACTIVE
    if (room.status !== "ACTIVE") {
      try {
        await updateRoomStatus(roomId, "ACTIVE");
      } catch (error) {
        console.error("Failed to activate room:", error);
        return {
          success: false,
          message: "Failed to activate the room",
        };
      }
    }
  }

  const { participants, ...roomData } = room;

  return {
    success: true,
    message: "Room is valid and accessible",
    room: roomData,
  };
}

export async function getRoom(){
    return await prisma.room.findMany()
}

export async function markParticipantasJoined(roomId:string , email:string){
    const participant = await prisma.participant.findUnique({
        where : {
            roomId_email:{
                roomId:roomId,
                email:email
            },
        },
    })

    if(!participant){
        return {success:false, message:"Participant not found in this room"}
    }

    const updated = await prisma.participant.update({
        where:{
            roomId_email:{
                roomId:roomId,
                email:email
            },
        },
        data:{
            joinedAt:new Date(),
            isJoined:true
        }
    })

    return {
        success:true,
        message: "Participant marked as joined",
        participant: updated,
    }
}

export async function updateRoomStatus(roomId:string , key:string){
  const updatedRoom = await prisma.room.update({
    where : {
      id : roomId
    },
    data : {
      status:RoomStatus[key as keyof typeof RoomStatus]
    }
    
  })

  return {
    success:true,
    message:"Room status updated",
    room:updatedRoom
  }
}

export async function leaveParticipant(roomId: string, email: string) {
  const participant = await prisma.participant.findUnique({
    where: {
      roomId_email: {
        roomId,
        email,
      },
    },
  });

  if (!participant) {
    return {
      success: false,
      message: "Participant not found in this room",
    };
  }

  if (!participant.isJoined) {
    return {
      success: false,
      message: "Participant is already marked as left",
    };
  }

  const room = await prisma.room.findUnique({
    where: { id: roomId },
  });

  if (!room) {
    return {
      success: false,
      message: "Room not found",
    };
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 60 * 1000); // now + 30 min

  // Mark participant as left
  const updatedParticipant = await prisma.participant.update({
    where: {
      roomId_email: {
        roomId,
        email,
      },
    },
    data: {
      isJoined: false,
      leftAt: now,
    },
  });

  // If the creator is leaving
  if (participant.role === ParticipantRole.CREATOR) {
    await prisma.room.update({
      where: { id: roomId },
      data: {
        status: "INACTIVE",
        expiresAt: expiresAt,
      },
    });

    return {
      success: true,
      message: "Creator left the room. Room marked as INACTIVE and extended by 30 mins.",
      participant: updatedParticipant,
    };
  }

  // Check if any other participant is still joined
  const joinedCount = await prisma.participant.count({
    where: {
      roomId,
      isJoined: true,
    },
  });

  if (joinedCount === 0) {
    await prisma.room.update({
      where: { id: roomId },
      data: {
        status: "INACTIVE",
        expiresAt: expiresAt,
      },
    });

    return {
      success: true,
      message: "Last participant left. Room marked as INACTIVE and extended by 30 mins.",
      participant: updatedParticipant,
    };
  }

  return {
    success: true,
    message: "Participant has left the room",
    participant: updatedParticipant,
  };
}