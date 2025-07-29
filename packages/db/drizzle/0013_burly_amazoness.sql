-- Delete duplicate prompts, keeping the most recent one
DELETE FROM "ai_prompts"
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY name ORDER BY "createdAt" DESC) as rn
    FROM "ai_prompts"
  ) t
  WHERE t.rn > 1
);

ALTER TABLE "ai_prompts" ADD CONSTRAINT "ai_prompts_name_unique" UNIQUE("name");