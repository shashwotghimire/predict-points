-- CreateEnum
CREATE TYPE "RewardType" AS ENUM ('TOPUP', 'DISCOUNT_COUPON', 'FOOD_VOUCHER', 'FREE_PINTS', 'GIFT_CARD', 'OTHER');

-- AlterTable
ALTER TABLE "Reward"
ADD COLUMN "type" "RewardType" NOT NULL DEFAULT 'OTHER';

-- AlterTable
ALTER TABLE "RewardRedemption"
ADD COLUMN "redemptionData" JSONB;

-- CreateIndex
CREATE INDEX "Reward_type_idx" ON "Reward"("type");
