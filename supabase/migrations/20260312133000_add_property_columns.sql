-- Add missing structured columns to properties table
-- This allows saving form fields as individual columns instead of concatenating them in description

ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS living_rooms INTEGER,
ADD COLUMN IF NOT EXISTS suites INTEGER,
ADD COLUMN IF NOT EXISTS area_total NUMERIC,
ADD COLUMN IF NOT EXISTS area_built NUMERIC,
ADD COLUMN IF NOT EXISTS land_width NUMERIC,
ADD COLUMN IF NOT EXISTS land_length NUMERIC,
ADD COLUMN IF NOT EXISTS property_condition TEXT,
ADD COLUMN IF NOT EXISTS renovation_stage TEXT,
ADD COLUMN IF NOT EXISTS construction_stage TEXT,
ADD COLUMN IF NOT EXISTS occupation_status TEXT,
ADD COLUMN IF NOT EXISTS iptu_mode TEXT,
ADD COLUMN IF NOT EXISTS iptu_value NUMERIC,
ADD COLUMN IF NOT EXISTS condominium_value NUMERIC,
ADD COLUMN IF NOT EXISTS financing_types TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS mcmv_eligible BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS accepts_exchange BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS exchange_vehicle_value NUMERIC,
ADD COLUMN IF NOT EXISTS exchange_property_value NUMERIC,
ADD COLUMN IF NOT EXISTS accepts_other_asset BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS other_asset_description TEXT,
ADD COLUMN IF NOT EXISTS other_asset_value NUMERIC,
ADD COLUMN IF NOT EXISTS prospectors TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS address_visibility TEXT DEFAULT 'endereco_completo';

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
