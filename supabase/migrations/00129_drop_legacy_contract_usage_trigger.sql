-- Drop legacy trigger and function that update non-existent contracts.usage_count
-- This fixes errors when inserting into contract_offers

-- 1) Drop old AFTER INSERT trigger that calls increment_contract_usage()
DO $$ BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trigger_increment_contract_usage'
      AND tgrelid = 'public.contract_offers'::regclass
  ) THEN
    DROP TRIGGER trigger_increment_contract_usage ON public.contract_offers;
  END IF;
END $$;

-- 2) Drop legacy trigger function increment_contract_usage() (no-arg variant)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'increment_contract_usage'
      AND oid = 'public.increment_contract_usage()'::regprocedure
  ) THEN
    DROP FUNCTION public.increment_contract_usage();
  END IF;
END $$;

-- 3) Ensure the new usage tracking trigger exists (inserts into public.contract_usage)
-- Recreate function idempotently
CREATE OR REPLACE FUNCTION public.trigger_insert_contract_usage()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.contract_usage (contract_id, contract_offer_id, used_at, used_by)
  VALUES (NEW.contract_id, NEW.id, COALESCE(NEW.sent_at, NOW()), NEW.sent_by);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger idempotently
DROP TRIGGER IF EXISTS trg_contract_offer_usage ON public.contract_offers;
CREATE TRIGGER trg_contract_offer_usage
AFTER INSERT ON public.contract_offers
FOR EACH ROW EXECUTE FUNCTION public.trigger_insert_contract_usage(); 