-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "platform_users" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" VARCHAR(20) NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_sessions" (
    "id" TEXT NOT NULL,
    "tokenHash" VARCHAR(64) NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "tokenHash" VARCHAR(64) NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_chat_sessions" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "agentId" VARCHAR(100) NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "settings" JSONB,
    "projectFiles" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_chat_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_chat_messages" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "sender" VARCHAR(16) NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_chat_files" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "filePath" VARCHAR(500) NOT NULL,
    "content" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_chat_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_chat_feedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "value" VARCHAR(16) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_chat_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_chat_stats" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "stats" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_chat_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_memories" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "agentId" VARCHAR(100) NOT NULL,
    "profile" JSONB,
    "memories" JSONB NOT NULL DEFAULT '[]',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_memories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_lab_runs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "labId" VARCHAR(80) NOT NULL,
    "input" JSONB NOT NULL,
    "output" JSONB NOT NULL,
    "provider" VARCHAR(40) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_lab_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_lab_votes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "battleId" VARCHAR(160) NOT NULL,
    "choice" VARCHAR(16) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_lab_votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "platform_users_email_key" ON "platform_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "platform_sessions_tokenHash_key" ON "platform_sessions"("tokenHash");

-- CreateIndex
CREATE INDEX "platform_sessions_userId_expiresAt_idx" ON "platform_sessions"("userId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_tokenHash_key" ON "password_reset_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_userId_expiresAt_idx" ON "password_reset_tokens"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "agent_chat_sessions_ownerId_agentId_updatedAt_idx" ON "agent_chat_sessions"("ownerId", "agentId", "updatedAt");

-- CreateIndex
CREATE INDEX "agent_chat_messages_sessionId_createdAt_idx" ON "agent_chat_messages"("sessionId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "agent_chat_files_sessionId_filePath_key" ON "agent_chat_files"("sessionId", "filePath");

-- CreateIndex
CREATE UNIQUE INDEX "agent_chat_feedback_userId_messageId_key" ON "agent_chat_feedback"("userId", "messageId");

-- CreateIndex
CREATE UNIQUE INDEX "agent_chat_stats_sessionId_key" ON "agent_chat_stats"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "agent_memories_userId_agentId_key" ON "agent_memories"("userId", "agentId");

-- CreateIndex
CREATE INDEX "platform_lab_runs_userId_createdAt_idx" ON "platform_lab_runs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "platform_lab_runs_labId_createdAt_idx" ON "platform_lab_runs"("labId", "createdAt");

-- CreateIndex
CREATE INDEX "platform_lab_votes_battleId_idx" ON "platform_lab_votes"("battleId");

-- CreateIndex
CREATE UNIQUE INDEX "platform_lab_votes_userId_battleId_key" ON "platform_lab_votes"("userId", "battleId");

-- AddForeignKey
ALTER TABLE "platform_sessions" ADD CONSTRAINT "platform_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "platform_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "platform_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_chat_sessions" ADD CONSTRAINT "agent_chat_sessions_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "platform_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_chat_messages" ADD CONSTRAINT "agent_chat_messages_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "agent_chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_chat_files" ADD CONSTRAINT "agent_chat_files_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "agent_chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_chat_feedback" ADD CONSTRAINT "agent_chat_feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "platform_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_chat_feedback" ADD CONSTRAINT "agent_chat_feedback_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "agent_chat_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_chat_stats" ADD CONSTRAINT "agent_chat_stats_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "agent_chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_memories" ADD CONSTRAINT "agent_memories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "platform_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_lab_runs" ADD CONSTRAINT "platform_lab_runs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "platform_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_lab_votes" ADD CONSTRAINT "platform_lab_votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "platform_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
