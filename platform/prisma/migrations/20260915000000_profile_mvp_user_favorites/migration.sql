-- 个人主页 MVP：用户足迹关联 + 用户级收藏 + 提交归属
-- 全部为增量式变更（新增可空列/新表/索引），兼容现有用户、日志、博客、提示词与提交记录。

-- 1. User 增加时间戳（已有用户以当前时间回填加入时间）
ALTER TABLE "User" ADD COLUMN "createdAt" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "User" ADD COLUMN "updatedAt" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 2. AnalyticsLog 关联用户（匿名足迹 userId 保持 NULL，删除用户时置空）
ALTER TABLE "AnalyticsLog" ADD COLUMN "userId" TEXT;
ALTER TABLE "AnalyticsLog"
  ADD CONSTRAINT "AnalyticsLog_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "AnalyticsLog_userId_timestamp_idx" ON "AnalyticsLog"("userId", "timestamp");
CREATE INDEX "AnalyticsLog_userId_resourceType_actionType_timestamp_idx"
  ON "AnalyticsLog"("userId", "resourceType", "actionType", "timestamp");

-- 3. Blog 全局收藏计数
ALTER TABLE "Blog" ADD COLUMN "favorites" INTEGER NOT NULL DEFAULT 0;

-- 4. 用户提示词收藏
CREATE TABLE "UserPromptFavorite" (
    "userId" TEXT NOT NULL,
    "promptId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserPromptFavorite_pkey" PRIMARY KEY ("userId", "promptId")
);
CREATE INDEX "UserPromptFavorite_userId_createdAt_idx" ON "UserPromptFavorite"("userId", "createdAt");
CREATE INDEX "UserPromptFavorite_promptId_idx" ON "UserPromptFavorite"("promptId");
ALTER TABLE "UserPromptFavorite"
  ADD CONSTRAINT "UserPromptFavorite_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserPromptFavorite"
  ADD CONSTRAINT "UserPromptFavorite_promptId_fkey"
  FOREIGN KEY ("promptId") REFERENCES "Prompt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 5. 用户博客收藏
CREATE TABLE "UserBlogFavorite" (
    "userId" TEXT NOT NULL,
    "blogId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserBlogFavorite_pkey" PRIMARY KEY ("userId", "blogId")
);
CREATE INDEX "UserBlogFavorite_userId_createdAt_idx" ON "UserBlogFavorite"("userId", "createdAt");
CREATE INDEX "UserBlogFavorite_blogId_idx" ON "UserBlogFavorite"("blogId");
ALTER TABLE "UserBlogFavorite"
  ADD CONSTRAINT "UserBlogFavorite_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserBlogFavorite"
  ADD CONSTRAINT "UserBlogFavorite_blogId_fkey"
  FOREIGN KEY ("blogId") REFERENCES "Blog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 6. 工具提交 / 需求许愿 关联提交用户（历史匿名数据保持 NULL）
ALTER TABLE "ToolSubmission" ADD COLUMN "userId" TEXT;
ALTER TABLE "ToolSubmission"
  ADD CONSTRAINT "ToolSubmission_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "ToolSubmission_userId_createdAt_idx" ON "ToolSubmission"("userId", "createdAt");

ALTER TABLE "ToolDemand" ADD COLUMN "userId" TEXT;
ALTER TABLE "ToolDemand"
  ADD CONSTRAINT "ToolDemand_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "ToolDemand_userId_createdAt_idx" ON "ToolDemand"("userId", "createdAt");
