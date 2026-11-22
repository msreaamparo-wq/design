ALTER TABLE virtual_tryons ADD COLUMN IF NOT EXISTS provider_prediction_id TEXT;
ALTER TABLE virtual_tryons ADD COLUMN IF NOT EXISTS person_storage_key TEXT;
ALTER TABLE virtual_tryons ADD COLUMN IF NOT EXISTS garment_storage_key TEXT;
ALTER TABLE virtual_tryons ADD COLUMN IF NOT EXISTS result_storage_key TEXT;