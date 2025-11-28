-- Migration: Remove stock management from products, product_option_values, and product_addons

-- Drop stock management functions
DROP FUNCTION IF EXISTS public.deduct_product_stock(UUID, INTEGER);
DROP FUNCTION IF EXISTS public.restore_product_stock(UUID, INTEGER);
DROP FUNCTION IF EXISTS public.deduct_option_stock(UUID, INTEGER);
DROP FUNCTION IF EXISTS public.restore_option_stock(UUID, INTEGER);
DROP FUNCTION IF EXISTS public.deduct_addon_stock(UUID, INTEGER);
DROP FUNCTION IF EXISTS public.restore_addon_stock(UUID, INTEGER);

-- Remove stock column from products table
ALTER TABLE IF EXISTS public.products
  DROP COLUMN IF EXISTS stock;

-- Remove stock column from product_option_values table
ALTER TABLE IF EXISTS public.product_option_values
  DROP COLUMN IF EXISTS stock;

-- Remove stock column from product_addons table
ALTER TABLE IF EXISTS public.product_addons
  DROP COLUMN IF EXISTS stock;
