ALTER TABLE "pages" ALTER COLUMN "content" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "pages" ALTER COLUMN "content" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "pages" ALTER COLUMN "content" SET NOT NULL;