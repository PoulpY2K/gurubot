-- AlterTable
ALTER TABLE "Player" ADD COLUMN     "currentGateId" INTEGER;

-- CreateTable
CREATE TABLE "Gate" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "color" TEXT NOT NULL,
    "entries" INTEGER NOT NULL,
    "image" TEXT NOT NULL,
    "createdAt" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Gate_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_currentGateId_fkey" FOREIGN KEY ("currentGateId") REFERENCES "Gate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
