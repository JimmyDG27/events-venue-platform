-- AlterTable: add email verification columns to users
ALTER TABLE "users"
  ADD COLUMN "email_verified" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "email_verification_token" TEXT;

-- CreateIndex: unique constraint on email_verification_token
CREATE UNIQUE INDEX "users_email_verification_token_key"
  ON "users"("email_verification_token");
