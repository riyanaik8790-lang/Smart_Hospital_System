-- Keep existing staff records valid while requiring a correctly formatted
-- phone number for every new account created by the application.
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_phone_10_digits'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_phone_10_digits
      CHECK (phone IS NULL OR phone ~ '^[0-9]{10}$');
  END IF;
END $$;
