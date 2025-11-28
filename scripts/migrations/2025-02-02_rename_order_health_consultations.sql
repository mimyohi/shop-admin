-- Rename table to singular form
ALTER TABLE IF EXISTS public.order_health_consultations
  RENAME TO order_health_consultation;

-- Rename constraints that still reference the old table name (if they exist)
DO $$
DECLARE
  constraint_record record;
BEGIN
  FOR constraint_record IN
    SELECT conname
    FROM pg_constraint
    WHERE connamespace = 'public'::regnamespace
      AND conname LIKE 'order_health_consultations%'
  LOOP
    EXECUTE format(
      'ALTER TABLE public.order_health_consultation RENAME CONSTRAINT %I TO %I',
      constraint_record.conname,
      replace(constraint_record.conname, 'order_health_consultations', 'order_health_consultation')
    );
  END LOOP;
END $$;

-- Rename indexes generated with the old table name to keep naming consistent
DO $$
DECLARE
  idx record;
BEGIN
  FOR idx IN
    SELECT indexname
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'order_health_consultation'
      AND indexname LIKE 'order_health_consultations%'
  LOOP
    EXECUTE format(
      'ALTER INDEX %I RENAME TO %I',
      idx.indexname,
      replace(idx.indexname, 'order_health_consultations', 'order_health_consultation')
    );
  END LOOP;
END $$;
