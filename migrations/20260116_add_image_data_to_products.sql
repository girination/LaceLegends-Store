-- Add image_data column to store base64/data-URL image payloads for products
ALTER TABLE IF EXISTS products
ADD COLUMN IF NOT EXISTS image_data TEXT;

-- Note: storing images in the database increases DB size and may affect performance.
-- Consider using Supabase Storage for large-scale usage.
