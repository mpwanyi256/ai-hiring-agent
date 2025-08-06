-- Add currency_id column to contracts table
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS currency_id UUID REFERENCES currencies(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_contracts_currency_id ON contracts(currency_id);

-- Set default currency to USD for existing contracts
UPDATE contracts 
SET currency_id = (SELECT id FROM currencies WHERE code = 'USD' LIMIT 1)
WHERE currency_id IS NULL;

-- Make currency_id NOT NULL after setting defaults
ALTER TABLE contracts 
ALTER COLUMN currency_id SET NOT NULL;
