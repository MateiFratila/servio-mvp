-- Remove unbooked availability slots that do not start on the hour.
-- These are leftovers from the old 1h30m slot paradigm (09:00, 10:30, 12:00…).
-- Booked slots are intentionally left untouched.
DELETE FROM availability_slots
WHERE is_booked = 0
  AND MINUTE(start_time) != 0;
