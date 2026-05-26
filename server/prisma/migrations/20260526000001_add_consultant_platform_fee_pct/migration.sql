-- Add per-consultant platform fee percentage (default 30%)
ALTER TABLE `consultant_profiles`
  ADD COLUMN `platform_fee_pct` DECIMAL(5, 2) NOT NULL DEFAULT 30.00;
