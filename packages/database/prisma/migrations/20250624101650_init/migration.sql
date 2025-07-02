/*
  Warnings:

  - You are about to drop the `Post` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_authorId_fkey";

-- DropTable
DROP TABLE "Post";

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "roomName" TEXT,
    "creatorId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "participants" JSONB,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);
