-- Run once against existing deployments. Historical discharges do not have a
-- timestamp and remain NULL; future discharge events are recorded precisely.
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS discharged_at TIMESTAMPTZ;
