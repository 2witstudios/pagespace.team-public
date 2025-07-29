CREATE TABLE IF NOT EXISTS "dashboard_assistant_conversations" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"model" text DEFAULT 'google:gemini-1.5-pro' NOT NULL,
	"providerOverride" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL,
	"userId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "dashboard_assistant_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"toolCalls" jsonb,
	"toolResults" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"editedAt" timestamp,
	"toolCallActioned" boolean DEFAULT false NOT NULL,
	"conversationId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_dashboards" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL,
	CONSTRAINT "user_dashboards_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dashboard_assistant_conversations" ADD CONSTRAINT "dashboard_assistant_conversations_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dashboard_assistant_messages" ADD CONSTRAINT "dashboard_assistant_messages_conversationId_dashboard_assistant_conversations_id_fk" FOREIGN KEY ("conversationId") REFERENCES "public"."dashboard_assistant_conversations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_dashboards" ADD CONSTRAINT "user_dashboards_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "dashboard_assistant_conversations_user_id_idx" ON "dashboard_assistant_conversations" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "dashboard_assistant_messages_conversation_id_idx" ON "dashboard_assistant_messages" USING btree ("conversationId");