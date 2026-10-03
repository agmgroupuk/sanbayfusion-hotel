ALTER TABLE "platform_lab_votes"
  DROP CONSTRAINT "platform_lab_votes_userId_fkey";

ALTER TABLE "platform_lab_votes"
  ALTER COLUMN "userId" DROP NOT NULL;

ALTER TABLE "platform_lab_votes"
  ADD CONSTRAINT "platform_lab_votes_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "platform_users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
