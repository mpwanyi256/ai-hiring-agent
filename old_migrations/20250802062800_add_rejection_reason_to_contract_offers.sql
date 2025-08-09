-- Add rejection_reason field to contract_offers table
ALTER TABLE contract_offers 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Update the contract_offer_details view to include the new rejection_reason field
DROP VIEW IF EXISTS contract_offer_details;

CREATE VIEW contract_offer_details AS
SELECT 
  co.id,
  co.contract_id,
  co.candidate_id,
  co.sent_by,
  co.status,
  co.sent_at,
  co.signed_at,
  co.rejected_at,
  co.expires_at,
  co.signing_token,
  co.salary_amount,
  co.salary_currency,
  co.start_date,
  co.end_date,
  co.additional_terms,
  co.rejection_reason,  -- New field added
  co.created_at,
  co.updated_at,
  
  -- Contract details
  c.title as contract_title,
  c.body as contract_body,
  c.company_id,
  
  -- Candidate details
  ci.email as candidate_email,
  ci.first_name as candidate_first_name,
  ci.last_name as candidate_last_name,
  ci.phone as candidate_phone,
  
  -- Sender details (who sent the contract)
  sender_profile.email as sender_email,
  sender_profile.first_name as sender_first_name,
  sender_profile.last_name as sender_last_name,
  
  -- Company details
  comp.name as company_name,
  comp.slug as company_slug
  
FROM contract_offers co
LEFT JOIN contracts c ON co.contract_id = c.id
LEFT JOIN candidates cand ON co.candidate_id = cand.id
LEFT JOIN candidates_info ci ON cand.candidate_info_id = ci.id
LEFT JOIN profiles sender_profile ON co.sent_by = sender_profile.id
LEFT JOIN companies comp ON c.company_id = comp.id;

-- Add comment for documentation
COMMENT ON COLUMN contract_offers.rejection_reason IS 'Optional reason provided by candidate when rejecting a contract offer';
