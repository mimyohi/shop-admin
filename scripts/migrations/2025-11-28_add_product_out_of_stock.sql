-- Migration: Add is_out_of_stock column to products table
-- Date: 2025-11-28
-- Description: 상품 품절 상태를 관리하기 위한 컬럼 추가

BEGIN;

-- Add is_out_of_stock column to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS is_out_of_stock BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN products.is_out_of_stock IS '품절 여부 (true: 품절, false: 판매중)';

-- Create index for filtering out of stock products
CREATE INDEX IF NOT EXISTS idx_products_out_of_stock
ON products(is_out_of_stock)
WHERE is_out_of_stock = true;

COMMIT;
