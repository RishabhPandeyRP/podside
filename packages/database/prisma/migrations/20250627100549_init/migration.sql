/*
  Warnings:

  - You are about to drop the column `isActive` on the `Room` table. All the data in the column will be lost.
  - You are about to drop the column `participants` on the `Room` table. All the data in the column will be lost.
  - Made the column `creatorId` on table `Room` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('PENDING', 'ACTIVE', 'INACTIVE', 'DELETED');

-- CreateEnum
CREATE TYPE "ParticipantRole" AS ENUM ('CREATOR', 'GUEST');

-- AlterTable
ALTER TABLE "Room" DROP COLUMN "isActive",
DROP COLUMN "participants",
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "maxParticipants" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "status" "RoomStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "updatedAt" TIMESTAMP(3),
ALTER COLUMN "creatorId" SET NOT NULL;

-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "isJoined" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3),
    "leftAt" TIMESTAMP(3),
    "role" "ParticipantRole" NOT NULL DEFAULT 'GUEST',

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Participant_roomId_email_key" ON "Participant"("roomId", "email");

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
