-- Notifications for contract-related events sent to job members (using existing notifications table)

-- Trigger function to create notifications for job members when a contract offer is inserted
CREATE OR REPLACE FUNCTION public.notify_job_members_on_contract_offer()
RETURNS TRIGGER AS $$
DECLARE
  v_company_id UUID;
  v_contract_title TEXT;
  v_job_id UUID;
BEGIN
  -- Resolve company, title and job from contracts (assumes contract has a related job via job_titles or explicit job_id)
  SELECT c.company_id, c.title INTO v_company_id, v_contract_title
  FROM public.contracts c
  WHERE c.id = NEW.contract_id;

  -- Attempt to resolve job_id directly from the offer if column exists; otherwise try to find via the candidate/job applications
  BEGIN
    SELECT NEW.job_id INTO v_job_id; -- will error if column doesn't exist
  EXCEPTION WHEN undefined_column THEN
    -- fallback: try to resolve from jobs table via candidate or a join table if available; leave NULL if unknown
    v_job_id := NULL;
  END;

  -- Insert a notification for each user with permissions on the job (if job_id known)
  IF v_job_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, company_id, type, title, message, metadata)
    SELECT jp.user_id, v_company_id, 'contract_offer',
           CASE 
             WHEN NEW.status = 'signed' THEN 'Contract Signed'
             WHEN NEW.status = 'rejected' THEN 'Contract Rejected'
             ELSE 'Contract Sent'
           END,
           CASE 
             WHEN NEW.status = 'signed' THEN 'A contract has been signed: ' || COALESCE(v_contract_title, '')
             WHEN NEW.status = 'rejected' THEN 'A contract has been rejected: ' || COALESCE(v_contract_title, '')
             ELSE 'A contract has been sent: ' || COALESCE(v_contract_title, '')
           END,
           jsonb_build_object(
             'contract_offer_id', NEW.id,
             'contract_id', NEW.contract_id,
             'candidate_id', NEW.candidate_id,
             'status', NEW.status,
             'job_id', v_job_id
           )
    FROM public.job_permissions jp
    WHERE jp.job_id = v_job_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger on contract_offers insert
DROP TRIGGER IF EXISTS trg_notify_job_members_on_contract_offer ON public.contract_offers;
CREATE TRIGGER trg_notify_job_members_on_contract_offer
AFTER INSERT ON public.contract_offers
FOR EACH ROW EXECUTE FUNCTION public.notify_job_members_on_contract_offer(); 