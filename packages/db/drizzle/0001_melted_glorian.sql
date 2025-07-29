CREATE TABLE IF NOT EXISTS "user_ai_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"provider" text NOT NULL,
	"encryptedApiKey" text,
	"isDefault" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_provider_unique" UNIQUE("userId","provider")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_ai_settings" ADD CONSTRAINT "user_ai_settings_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
