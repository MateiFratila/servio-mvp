-- Add Stripe Connect fields to consultant_profiles
ALTER TABLE `consultant_profiles`
  ADD COLUMN `stripe_account_id` VARCHAR(191) NULL,
  ADD COLUMN `stripe_onboarding_complete` BOOLEAN NOT NULL DEFAULT false;
