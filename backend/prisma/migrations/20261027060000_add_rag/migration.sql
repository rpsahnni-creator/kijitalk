-- AlterTable
ALTER TABLE "lessons" ADD COLUMN     "embedding" DOUBLE PRECISION[] DEFAULT ARRAY[]::DOUBLE PRECISION[];

-- CreateTable
CREATE TABLE "mistake_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "original" TEXT NOT NULL,
    "corrected" TEXT NOT NULL,
    "topic" TEXT,
    "embedding" DOUBLE PRECISION[] DEFAULT ARRAY[]::DOUBLE PRECISION[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mistake_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mistake_logs_userId_createdAt_idx" ON "mistake_logs"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "mistake_logs" ADD CONSTRAINT "mistake_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
