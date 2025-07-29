CREATE TABLE IF NOT EXISTS "ai_prompts" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"content" text NOT NULL,
	"context" text NOT NULL,
	"subContext" text,
	"pageType" text,
	"version" integer DEFAULT 1 NOT NULL,
	"isDefault" boolean DEFAULT false NOT NULL,
	"createdBy" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_prompts" ADD CONSTRAINT "ai_prompts_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
