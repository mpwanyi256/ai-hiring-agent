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

-- Create index on currency code for fast lookups
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
  ('IDR', 'Indonesian Rupiah', 'Rp', 2),
  ('PHP', 'Philippine Peso', '₱', 2),
  ('VND', 'Vietnamese Dong', '₫', 0),
  ('ZAR', 'South African Rand', 'R', 2),
  ('EGP', 'Egyptian Pound', '£', 2),
  ('NGN', 'Nigerian Naira', '₦', 2),
  ('KES', 'Kenyan Shilling', 'KSh', 2),
  ('GHS', 'Ghanaian Cedi', '₵', 2),
  ('MAD', 'Moroccan Dirham', 'MAD', 2),
  ('TND', 'Tunisian Dinar', 'د.ت', 3),
  ('AED', 'UAE Dirham', 'د.إ', 2),
  ('SAR', 'Saudi Riyal', '﷼', 2),
  ('QAR', 'Qatari Riyal', '﷼', 2),
  ('KWD', 'Kuwaiti Dinar', 'د.ك', 3),
  ('BHD', 'Bahraini Dinar', '.د.ب', 3),
  ('OMR', 'Omani Rial', '﷼', 3),
  ('JOD', 'Jordanian Dinar', 'د.ا', 3),
  ('LBP', 'Lebanese Pound', '£', 2),
  ('ILS', 'Israeli Shekel', '₪', 2)
ON CONFLICT (code) DO NOTHING;

-- Enable RLS
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access to all users
CREATE POLICY "Allow read access to currencies" ON currencies
  FOR SELECT USING (true);

-- Create policy to allow insert/update/delete for authenticated users (admin functionality)
CREATE POLICY "Allow full access to currencies for authenticated users" ON currencies
  FOR ALL USING (auth.uid() IS NOT NULL);
