ALTER TABLE "assistant_conversations" ADD COLUMN "model" text DEFAULT 'google:gemini-1.5-pro' NOT NULL;--> statement-breakpoint
ALTER TABLE "assistant_conversations" ADD COLUMN "providerOverride" text;--> statement-breakpoint
ALTER TABLE "user_ai_settings" DROP COLUMN IF EXISTS "isDefault";