-- CreateEnum
CREATE TYPE "MarketType" AS ENUM ('YES_NO', 'MULTI_4', 'OVER_UNDER');

-- CreateEnum
CREATE TYPE "MarketCategory" AS ENUM ('TRENDING', 'POLITICS', 'SPORTS');

-- CreateEnum
CREATE TYPE "PredictionStatus" AS ENUM ('ACTIVE', 'WON', 'LOST', 'VOID');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('EVENT_CREATED', 'EVENT_UPDATED', 'EVENT_DELETED', 'EVENT_DECLARED', 'PREDICTION_SUBMITTED', 'COMMENT_ADDED', 'REWARD_REDEEMED');

-- CreateEnum
CREATE TYPE "RewardStatus" AS ENUM ('REDEEMED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'ADMIN';

-- AlterTable
ALTER TABLE "Market" ADD COLUMN     "category" "MarketCategory" NOT NULL DEFAULT 'TRENDING',
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "declaredAt" TIMESTAMP(3),
ADD COLUMN     "declaredOptionId" TEXT,
ADD COLUMN     "eventIconUrl" TEXT,
ADD COLUMN     "isDeclared" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "type" "MarketType" NOT NULL DEFAULT 'YES_NO';

-- AlterTable
ALTER TABLE "Option" ADD COLUMN     "percentage" INTEGER NOT NULL DEFAULT 50;

-- AlterTable
ALTER TABLE "Prediction" ADD COLUMN     "potentialWinnings" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "resolvedAt" TIMESTAMP(3),
ADD COLUMN     "status" "PredictionStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER';

-- CreateTable
CREATE TABLE "OddsSnapshot" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "percentage" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OddsSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventComment" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "marketId" TEXT,
    "type" "ActivityType" NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RewardRedemption" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rewardName" TEXT NOT NULL,
    "pointsSpent" INTEGER NOT NULL,
    "status" "RewardStatus" NOT NULL DEFAULT 'REDEEMED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RewardRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OddsSnapshot_marketId_createdAt_idx" ON "OddsSnapshot"("marketId", "createdAt");

-- CreateIndex
CREATE INDEX "OddsSnapshot_optionId_createdAt_idx" ON "OddsSnapshot"("optionId", "createdAt");

-- CreateIndex
CREATE INDEX "EventComment_marketId_createdAt_idx" ON "EventComment"("marketId", "createdAt");

-- CreateIndex
CREATE INDEX "EventComment_userId_createdAt_idx" ON "EventComment"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_marketId_createdAt_idx" ON "ActivityLog"("marketId", "createdAt");

-- CreateIndex
CREATE INDEX "RewardRedemption_userId_createdAt_idx" ON "RewardRedemption"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Market_category_status_idx" ON "Market"("category", "status");

-- CreateIndex
CREATE INDEX "Market_type_idx" ON "Market"("type");

-- CreateIndex
CREATE INDEX "Market_createdById_idx" ON "Market"("createdById");

-- CreateIndex
CREATE INDEX "Option_marketId_idx" ON "Option"("marketId");

-- CreateIndex
CREATE INDEX "PointTransaction_userId_createdAt_idx" ON "PointTransaction"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Prediction_marketId_status_idx" ON "Prediction"("marketId", "status");

-- CreateIndex
CREATE INDEX "Prediction_userId_status_idx" ON "Prediction"("userId", "status");

-- AddForeignKey
ALTER TABLE "Market" ADD CONSTRAINT "Market_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Market" ADD CONSTRAINT "Market_declaredOptionId_fkey" FOREIGN KEY ("declaredOptionId") REFERENCES "Option"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OddsSnapshot" ADD CONSTRAINT "OddsSnapshot_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OddsSnapshot" ADD CONSTRAINT "OddsSnapshot_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "Option"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventComment" ADD CONSTRAINT "EventComment_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventComment" ADD CONSTRAINT "EventComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardRedemption" ADD CONSTRAINT "RewardRedemption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
