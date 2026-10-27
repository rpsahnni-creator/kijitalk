-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('free', 'premium');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "aiMessagesToday" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "aiUsageResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "subscriptionTier" "SubscriptionTier" NOT NULL DEFAULT 'free';
