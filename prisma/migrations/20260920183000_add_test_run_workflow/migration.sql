-- CreateEnum
CREATE TYPE "TestRunType" AS ENUM ('DRIVETRAIN', 'AUTONOMOUS', 'MECHANISM', 'OTHER');

-- CreateTable
CREATE TABLE "TestRun" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "robotId" TEXT NOT NULL,
    "taskId" TEXT,
    "buildLogId" TEXT,
    "notebookEntryId" TEXT,
    "createdById" TEXT NOT NULL,
    "configurationVersion" INTEGER NOT NULL DEFAULT 0,
    "type" "TestRunType" NOT NULL,
    "name" TEXT NOT NULL,
    "durationSeconds" DOUBLE PRECISION,
    "score" DOUBLE PRECISION,
    "passed" BOOLEAN NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TestRun_teamId_createdAt_idx" ON "TestRun"("teamId", "createdAt");

-- CreateIndex
CREATE INDEX "TestRun_robotId_configurationVersion_createdAt_idx" ON "TestRun"("robotId", "configurationVersion", "createdAt");

-- CreateIndex
CREATE INDEX "TestRun_taskId_createdAt_idx" ON "TestRun"("taskId", "createdAt");

-- AddForeignKey
ALTER TABLE "TestRun" ADD CONSTRAINT "TestRun_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestRun" ADD CONSTRAINT "TestRun_robotId_fkey" FOREIGN KEY ("robotId") REFERENCES "Robot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestRun" ADD CONSTRAINT "TestRun_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestRun" ADD CONSTRAINT "TestRun_buildLogId_fkey" FOREIGN KEY ("buildLogId") REFERENCES "BuildLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestRun" ADD CONSTRAINT "TestRun_notebookEntryId_fkey" FOREIGN KEY ("notebookEntryId") REFERENCES "NotebookEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestRun" ADD CONSTRAINT "TestRun_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
