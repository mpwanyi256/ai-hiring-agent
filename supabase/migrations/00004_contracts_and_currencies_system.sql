-- Contracts and Currencies System Migration
-- This migration adds the contracts system and currency support

-- Create currencies table
CREATE TABLE IF NOT EXISTS currencies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(3) NOT NULL UNIQUE, -- ISO 4217 currency code (USD, EUR, GBP, etc.)
  name VARCHAR(100) NOT NULL, -- Full currency name
  symbol VARCHAR(10) NOT NULL, -- Currency symbol ($, €, £, etc.)
  decimal_places INTEGER DEFAULT 2, -- Number of decimal places
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for currencies
CREATE INDEX IF NOT EXISTS idx_currencies_code ON currencies(code);
CREATE INDEX IF NOT EXISTS idx_currencies_active ON currencies(is_active);

-- Insert major world currencies
INSERT INTO currencies (code, name, symbol, decimal_places) VALUES
  ('USD', 'US Dollar', '$', 2),
  ('EUR', 'Euro', '€', 2),
  ('GBP', 'British Pound', '£', 2),
  ('JPY', 'Japanese Yen', '¥', 0),
  ('CAD', 'Canadian Dollar', 'C$', 2),
  ('AUD', 'Australian Dollar', 'A$', 2),
  ('CHF', 'Swiss Franc', 'CHF', 2),
  ('CNY', 'Chinese Yuan', '¥', 2),
  ('SEK', 'Swedish Krona', 'kr', 2),
  ('NOK', 'Norwegian Krone', 'kr', 2),
  ('DKK', 'Danish Krone', 'kr', 2),
  ('PLN', 'Polish Zloty', 'zł', 2),
  ('CZK', 'Czech Koruna', 'Kč', 2),
  ('HUF', 'Hungarian Forint', 'Ft', 2),
  ('RON', 'Romanian Leu', 'lei', 2),
  ('BGN', 'Bulgarian Lev', 'лв', 2),
  ('HRK', 'Croatian Kuna', 'kn', 2),
  ('RUB', 'Russian Ruble', '₽', 2),
  ('TRY', 'Turkish Lira', '₺', 2),
  ('BRL', 'Brazilian Real', 'R$', 2),
  ('MXN', 'Mexican Peso', '$', 2),
  ('ARS', 'Argentine Peso', '$', 2),
  ('CLP', 'Chilean Peso', '$', 0),
  ('COP', 'Colombian Peso', '$', 2),
  ('PEN', 'Peruvian Sol', 'S/', 2),
  ('INR', 'Indian Rupee', '₹', 2),
  ('KRW', 'South Korean Won', '₩', 0),
  ('SGD', 'Singapore Dollar', 'S$', 2),
  ('HKD', 'Hong Kong Dollar', 'HK$', 2),
  ('TWD', 'Taiwan Dollar', 'NT$', 2),
  ('THB', 'Thai Baht', '฿', 2),
  ('MYR', 'Malaysian Ringgit', 'RM', 2),
  ('IDR', 'Indonesian Rupiah', 'Rp', 0),
  ('PHP', 'Philippine Peso', '₱', 2),
  ('VND', 'Vietnamese Dong', '₫', 0),
  ('ZAR', 'South African Rand', 'R', 2),
  ('EGP', 'Egyptian Pound', 'E£', 2),
  ('MAD', 'Moroccan Dirham', 'DH', 2),
  ('NGN', 'Nigerian Naira', '₦', 2),
  ('KES', 'Kenyan Shilling', 'KSh', 2),
  ('GHS', 'Ghanaian Cedi', 'GH₵', 2),
  ('TND', 'Tunisian Dinar', 'DT', 3),
  ('LKR', 'Sri Lankan Rupee', 'Rs', 2),
  ('PKR', 'Pakistani Rupee', 'Rs', 2),
  ('BDT', 'Bangladeshi Taka', '৳', 2),
  ('AED', 'UAE Dirham', 'AED', 2),
  ('SAR', 'Saudi Riyal', '﷼', 2),
  ('QAR', 'Qatari Riyal', 'QR', 2),
  ('KWD', 'Kuwaiti Dinar', 'KD', 3),
  ('BHD', 'Bahraini Dinar', 'BD', 3),
  ('OMR', 'Omani Rial', 'OMR', 3),
  ('JOD', 'Jordanian Dinar', 'JD', 3),
  ('LBP', 'Lebanese Pound', 'L£', 2),
  ('ILS', 'Israeli Shekel', '₪', 2),
  ('IRR', 'Iranian Rial', '﷼', 2)
ON CONFLICT (code) DO NOTHING;

-- Create contract status enum
DO $$ BEGIN
    CREATE TYPE contract_status AS ENUM ('draft', 'active', 'archived', 'deprecated');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create contract category enum  
DO $$ BEGIN
    CREATE TYPE contract_category AS ENUM ('general', 'technical', 'executive', 'intern', 'freelance', 'custom');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create contracts table
CREATE TABLE IF NOT EXISTS contracts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status contract_status DEFAULT 'draft',
    category contract_category DEFAULT 'general',
    template_data JSONB DEFAULT '{}',
    version INTEGER DEFAULT 1,
    parent_contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
    is_template BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contract_offers table
CREATE TABLE IF NOT EXISTS contract_offers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'signed', 'rejected')),
    signed_copy_url TEXT,
    sent_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    signed_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    signing_token UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
    salary_amount DECIMAL(12,2),
    salary_currency VARCHAR(3) DEFAULT 'USD' REFERENCES currencies(code),
    start_date DATE,
    end_date DATE,
    additional_terms JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for contracts
CREATE INDEX IF NOT EXISTS idx_contracts_company_id ON contracts(company_id);
CREATE INDEX IF NOT EXISTS idx_contracts_created_by ON contracts(created_by);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_category ON contracts(category);
CREATE INDEX IF NOT EXISTS idx_contracts_is_template ON contracts(is_template);
CREATE INDEX IF NOT EXISTS idx_contracts_parent_contract_id ON contracts(parent_contract_id);

-- Create indexes for contract_offers
CREATE INDEX IF NOT EXISTS idx_contract_offers_contract_id ON contract_offers(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_offers_candidate_id ON contract_offers(candidate_id);
CREATE INDEX IF NOT EXISTS idx_contract_offers_status ON contract_offers(status);
CREATE INDEX IF NOT EXISTS idx_contract_offers_sent_by ON contract_offers(sent_by);
CREATE INDEX IF NOT EXISTS idx_contract_offers_signing_token ON contract_offers(signing_token);
CREATE INDEX IF NOT EXISTS idx_contract_offers_expires_at ON contract_offers(expires_at);
CREATE INDEX IF NOT EXISTS idx_contract_offers_salary_currency ON contract_offers(salary_currency);

-- Enable Row Level Security
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_offers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for currencies (public read access)
CREATE POLICY "Anyone can view active currencies" ON currencies
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage currencies" ON currencies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- RLS Policies for contracts
CREATE POLICY "Company members can view their contracts" ON contracts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.company_id = contracts.company_id
    )
  );

CREATE POLICY "Company members can manage their contracts" ON contracts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.company_id = contracts.company_id
    )
  );

CREATE POLICY "Anyone can view public contract templates" ON contracts
  FOR SELECT USING (is_public = true AND is_template = true);

-- RLS Policies for contract_offers
CREATE POLICY "Company members can view their contract offers" ON contract_offers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM contracts c
      JOIN profiles p ON c.company_id = p.company_id
      WHERE c.id = contract_offers.contract_id AND p.id = auth.uid()
    )
  );

CREATE POLICY "Company members can manage their contract offers" ON contract_offers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM contracts c
      JOIN profiles p ON c.company_id = p.company_id
      WHERE c.id = contract_offers.contract_id AND p.id = auth.uid()
    )
  );

CREATE POLICY "Candidates can view offers sent to them" ON contract_offers
  FOR SELECT USING (true); -- Candidates access via signing_token, not auth

-- Create function to handle contract versioning
CREATE OR REPLACE FUNCTION create_contract_version()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is an update to an existing contract, create a new version
  IF TG_OP = 'UPDATE' AND (OLD.content != NEW.content OR OLD.title != NEW.title) THEN
    NEW.version := OLD.version + 1;
    NEW.updated_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for contract versioning
CREATE TRIGGER trigger_contract_versioning
  BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION create_contract_version();

-- Create function to update usage count when contract is used
CREATE OR REPLACE FUNCTION increment_contract_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment usage count when a contract offer is created
  UPDATE contracts 
  SET usage_count = usage_count + 1,
      updated_at = NOW()
  WHERE id = NEW.contract_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to increment usage count
CREATE TRIGGER trigger_increment_contract_usage
  AFTER INSERT ON contract_offers
  FOR EACH ROW EXECUTE FUNCTION increment_contract_usage();

-- Add updated_at trigger to currencies
CREATE TRIGGER update_currencies_updated_at
    BEFORE UPDATE ON currencies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add updated_at trigger to contracts
CREATE TRIGGER update_contracts_updated_at
    BEFORE UPDATE ON contracts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add updated_at trigger to contract_offers
CREATE TRIGGER update_contract_offers_updated_at
    BEFORE UPDATE ON contract_offers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 