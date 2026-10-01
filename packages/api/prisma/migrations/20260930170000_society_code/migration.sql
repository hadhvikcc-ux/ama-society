-- Short society codes (e.g. AMA-001) for resident sign-up.
ALTER TABLE "Society" ADD COLUMN "code" TEXT;

-- Backfill existing societies: prefix = letters of the first word of the name (max 4,
-- upper case, 'SOC' if none), numbered per prefix in creation order.
WITH prefixed AS (
  SELECT id, "createdAt",
         COALESCE(NULLIF(UPPER(LEFT(REGEXP_REPLACE(SPLIT_PART(name, ' ', 1), '[^A-Za-z]', '', 'g'), 4)), ''), 'SOC') AS prefix
  FROM "Society"
), numbered AS (
  SELECT id, prefix, ROW_NUMBER() OVER (PARTITION BY prefix ORDER BY "createdAt", id) AS n
  FROM prefixed
)
UPDATE "Society" s
SET "code" = numbered.prefix || '-' || LPAD(numbered.n::text, 3, '0')
FROM numbered
WHERE s.id = numbered.id;

ALTER TABLE "Society" ALTER COLUMN "code" SET NOT NULL;
CREATE UNIQUE INDEX "Society_code_key" ON "Society"("code");
