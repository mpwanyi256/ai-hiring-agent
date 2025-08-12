-- Create contract_placeholders table
CREATE TABLE IF NOT EXISTS contract_placeholders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  example TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE contract_placeholders ENABLE ROW LEVEL SECURITY;

-- Create policies for contract_placeholders
CREATE POLICY "Anyone can view active contract placeholders" 
ON contract_placeholders FOR SELECT 
USING (is_active = true);

-- Create updated_at trigger
CREATE TRIGGER update_contract_placeholders_updated_at
  BEFORE UPDATE ON contract_placeholders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert predefined placeholders
INSERT INTO contract_placeholders (key, label, description, category, example) VALUES
  ('candidate_name', 'Candidate Name', 'Full name of the candidate/employee', 'candidate', 'John Smith'),
  ('candidate_email', 'Candidate Email', 'Email address of the candidate', 'candidate', 'john.smith@email.com'),
  ('company_name', 'Company Name', 'Name of the hiring company', 'company', 'Acme Corporation'),
  ('company_address', 'Company Address', 'Full address of the company', 'company', '123 Business St, City, State 12345'),
  ('job_title', 'Job Title', 'Position title for the role', 'job', 'Software Engineer'),
  ('salary_amount', 'Salary Amount', 'Numerical salary amount', 'compensation', '75000'),
  ('salary_currency', 'Salary Currency', 'Currency for the salary', 'compensation', 'USD'),
  ('start_date', 'Start Date', 'Employment start date', 'dates', 'January 15, 2024'),
  ('end_date', 'End Date', 'Employment end date (if applicable)', 'dates', 'January 15, 2025'),
  ('signing_date', 'Signing Date', 'Date when the contract is signed', 'dates', 'December 1, 2023'),
  ('employment_type', 'Employment Type', 'Type of employment arrangement', 'job', 'Full-time'),
  ('contract_duration', 'Contract Duration', 'Length of the contract period', 'contract', '12 months'),
  ('probation_period', 'Probation Period', 'Duration of probationary period', 'contract', '3 months'),
  ('notice_period', 'Notice Period', 'Required notice period for termination', 'contract', '30 days'),
  ('benefits_summary', 'Benefits Summary', 'Overview of employee benefits', 'compensation', 'Health insurance, 401k, PTO'),
  ('reporting_manager', 'Reporting Manager', 'Name of direct supervisor', 'job', 'Jane Doe'),
  ('department', 'Department', 'Department or division name', 'job', 'Engineering'),
  ('work_location', 'Work Location', 'Primary work location', 'job', 'Remote / San Francisco, CA'),
  ('working_hours', 'Working Hours', 'Standard working hours', 'job', '9:00 AM - 5:00 PM PST')
ON CONFLICT (key) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_contract_placeholders_category ON contract_placeholders(category);
CREATE INDEX IF NOT EXISTS idx_contract_placeholders_active ON contract_placeholders(is_active);

-- Create a view for easy access to active placeholders
CREATE OR REPLACE VIEW active_contract_placeholders AS
SELECT 
  id,
  key,
  label,
  description,
  category,
  example,
  created_at,
  updated_at
FROM contract_placeholders 
WHERE is_active = true
ORDER BY category, label;

-- Create function to get placeholders by category
CREATE OR REPLACE FUNCTION get_contract_placeholders_by_category(category_filter TEXT DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  key TEXT,
  label TEXT,
  description TEXT,
  category TEXT,
  example TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF category_filter IS NULL THEN
    RETURN QUERY
    SELECT 
      p.id,
      p.key,
      p.label,
      p.description,
      p.category,
      p.example
    FROM contract_placeholders p
    WHERE p.is_active = true
    ORDER BY p.category, p.label;
  ELSE
    RETURN QUERY
    SELECT 
      p.id,
      p.key,
      p.label,
      p.description,
      p.category,
      p.example
    FROM contract_placeholders p
    WHERE p.is_active = true AND p.category = category_filter
    ORDER BY p.label;
  END IF;
END;
$$;

-- Create function to get placeholder format (with curly braces)
CREATE OR REPLACE FUNCTION get_placeholder_format(placeholder_key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN '{{ ' || placeholder_key || ' }}';
END;
$$; 