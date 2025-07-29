DO $$ BEGIN
 CREATE TYPE "public"."PageType" AS ENUM('FOLDER', 'DOCUMENT', 'DATABASE', 'CHANNEL', 'AI_CHAT');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."PermissionAction" AS ENUM('VIEW', 'EDIT', 'SHARE', 'DELETE');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."SubjectType" AS ENUM('USER', 'GROUP');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "refresh_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"token" text NOT NULL,
	"device" text,
	"ip" text,
	"userAgent" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "refresh_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"emailVerified" timestamp,
	"image" text,
	"password" text,
	"tokenVersion" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "drives" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"ownerId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "favorites" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"pageId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mentions" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"sourcePageId" text NOT NULL,
	"targetPageId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "page_tags" (
	"pageId" text NOT NULL,
	"tagId" text NOT NULL,
	CONSTRAINT "page_tags_pageId_tagId_pk" PRIMARY KEY("pageId","tagId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pages" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"type" "PageType" NOT NULL,
	"content" jsonb,
	"position" real NOT NULL,
	"isTrashed" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL,
	"trashedAt" timestamp,
	"driveId" text NOT NULL,
	"parentId" text,
	"originalParentId" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tags" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"color" text NOT NULL,
	CONSTRAINT "tags_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "group_memberships" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"groupId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "groups" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"driveId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "permissions" (
	"id" text PRIMARY KEY NOT NULL,
	"action" "PermissionAction" NOT NULL,
	"subjectType" "SubjectType" NOT NULL,
	"subjectId" text NOT NULL,
	"pageId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_chats" (
	"id" text PRIMARY KEY NOT NULL,
	"pageId" text NOT NULL,
	"model" text DEFAULT 'google:gemini-1.5-pro' NOT NULL,
	"temperature" real DEFAULT 0.7 NOT NULL,
	"systemPrompt" text,
	CONSTRAINT "ai_chats_pageId_unique" UNIQUE("pageId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "assistant_conversations" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL,
	"userId" text NOT NULL,
	"driveId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "assistant_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"toolCalls" jsonb,
	"toolResults" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"editedAt" timestamp,
	"conversationId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "channel_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"pageId" text NOT NULL,
	"userId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chat_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"pageId" text NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"toolCalls" jsonb,
	"toolResults" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"editedAt" timestamp,
	"userId" text
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "drives" ADD CONSTRAINT "drives_ownerId_users_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "favorites" ADD CONSTRAINT "favorites_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "favorites" ADD CONSTRAINT "favorites_pageId_pages_id_fk" FOREIGN KEY ("pageId") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mentions" ADD CONSTRAINT "mentions_sourcePageId_pages_id_fk" FOREIGN KEY ("sourcePageId") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mentions" ADD CONSTRAINT "mentions_targetPageId_pages_id_fk" FOREIGN KEY ("targetPageId") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "page_tags" ADD CONSTRAINT "page_tags_pageId_pages_id_fk" FOREIGN KEY ("pageId") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "page_tags" ADD CONSTRAINT "page_tags_tagId_tags_id_fk" FOREIGN KEY ("tagId") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pages" ADD CONSTRAINT "pages_driveId_drives_id_fk" FOREIGN KEY ("driveId") REFERENCES "public"."drives"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "group_memberships" ADD CONSTRAINT "group_memberships_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "group_memberships" ADD CONSTRAINT "group_memberships_groupId_groups_id_fk" FOREIGN KEY ("groupId") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "groups" ADD CONSTRAINT "groups_driveId_drives_id_fk" FOREIGN KEY ("driveId") REFERENCES "public"."drives"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "permissions" ADD CONSTRAINT "permissions_pageId_pages_id_fk" FOREIGN KEY ("pageId") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_chats" ADD CONSTRAINT "ai_chats_pageId_pages_id_fk" FOREIGN KEY ("pageId") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "assistant_conversations" ADD CONSTRAINT "assistant_conversations_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "assistant_conversations" ADD CONSTRAINT "assistant_conversations_driveId_drives_id_fk" FOREIGN KEY ("driveId") REFERENCES "public"."drives"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "assistant_messages" ADD CONSTRAINT "assistant_messages_conversationId_assistant_conversations_id_fk" FOREIGN KEY ("conversationId") REFERENCES "public"."assistant_conversations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "channel_messages" ADD CONSTRAINT "channel_messages_pageId_pages_id_fk" FOREIGN KEY ("pageId") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "channel_messages" ADD CONSTRAINT "channel_messages_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_pageId_pages_id_fk" FOREIGN KEY ("pageId") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "refresh_tokens_user_id_idx" ON "refresh_tokens" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "drives_owner_id_idx" ON "drives" USING btree ("ownerId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "drives_owner_id_slug_key" ON "drives" USING btree ("ownerId","slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "favorites_user_id_page_id_key" ON "favorites" USING btree ("userId","pageId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mentions_source_page_id_target_page_id_key" ON "mentions" USING btree ("sourcePageId","targetPageId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mentions_source_page_id_idx" ON "mentions" USING btree ("sourcePageId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mentions_target_page_id_idx" ON "mentions" USING btree ("targetPageId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pages_drive_id_idx" ON "pages" USING btree ("driveId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pages_parent_id_idx" ON "pages" USING btree ("parentId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pages_parent_id_position_idx" ON "pages" USING btree ("parentId","position");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "group_memberships_user_id_group_id_key" ON "group_memberships" USING btree ("userId","groupId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "group_memberships_user_id_idx" ON "group_memberships" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "group_memberships_group_id_idx" ON "group_memberships" USING btree ("groupId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "groups_drive_id_name_key" ON "groups" USING btree ("driveId","name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "groups_drive_id_idx" ON "groups" USING btree ("driveId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "permissions_page_id_idx" ON "permissions" USING btree ("pageId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "permissions_subject_id_subject_type_idx" ON "permissions" USING btree ("subjectId","subjectType");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "permissions_page_id_subject_id_subject_type_idx" ON "permissions" USING btree ("pageId","subjectId","subjectType");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assistant_conversations_user_id_idx" ON "assistant_conversations" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assistant_conversations_drive_id_idx" ON "assistant_conversations" USING btree ("driveId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assistant_messages_conversation_id_idx" ON "assistant_messages" USING btree ("conversationId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assistant_messages_conversation_id_is_active_created_at_idx" ON "assistant_messages" USING btree ("conversationId","isActive","createdAt");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "channel_messages_page_id_idx" ON "channel_messages" USING btree ("pageId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_messages_page_id_idx" ON "chat_messages" USING btree ("pageId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_messages_user_id_idx" ON "chat_messages" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_messages_page_id_is_active_created_at_idx" ON "chat_messages" USING btree ("pageId","isActive","createdAt");