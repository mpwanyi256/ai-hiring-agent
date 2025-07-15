-- Create countries table
CREATE TABLE IF NOT EXISTS countries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  continent TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for countries table
CREATE INDEX IF NOT EXISTS idx_countries_name ON countries(name);
CREATE INDEX IF NOT EXISTS idx_countries_code ON countries(code);
CREATE INDEX IF NOT EXISTS idx_countries_continent ON countries(continent);

-- Create timezones table
CREATE TABLE IF NOT EXISTS timezones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  offset_hours INTEGER NOT NULL,
  offset_minutes INTEGER NOT NULL DEFAULT 0,
  is_dst BOOLEAN NOT NULL DEFAULT false,
  region TEXT NOT NULL,
  country_id UUID REFERENCES countries(id),
  city TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_timezones_name ON timezones(name);
CREATE INDEX IF NOT EXISTS idx_timezones_region ON timezones(region);
CREATE INDEX IF NOT EXISTS idx_timezones_country_id ON timezones(country_id);
CREATE INDEX IF NOT EXISTS idx_timezones_offset ON timezones(offset_hours, offset_minutes);

-- Insert countries data
INSERT INTO countries (name, code, continent) VALUES
-- North America
('United States', 'US', 'North America'),
('Canada', 'CA', 'North America'),
('Mexico', 'MX', 'North America'),

-- Europe
('United Kingdom', 'GB', 'Europe'),
('France', 'FR', 'Europe'),
('Germany', 'DE', 'Europe'),
('Italy', 'IT', 'Europe'),
('Spain', 'ES', 'Europe'),
('Netherlands', 'NL', 'Europe'),
('Sweden', 'SE', 'Europe'),
('Norway', 'NO', 'Europe'),
('Denmark', 'DK', 'Europe'),
('Finland', 'FI', 'Europe'),
('Greece', 'GR', 'Europe'),
('Poland', 'PL', 'Europe'),
('Czech Republic', 'CZ', 'Europe'),
('Hungary', 'HU', 'Europe'),
('Austria', 'AT', 'Europe'),
('Switzerland', 'CH', 'Europe'),
('Ireland', 'IE', 'Europe'),
('Portugal', 'PT', 'Europe'),
('Turkey', 'TR', 'Europe'),
('Russia', 'RU', 'Europe'),

-- Asia
('Japan', 'JP', 'Asia'),
('China', 'CN', 'Asia'),
('South Korea', 'KR', 'Asia'),
('Singapore', 'SG', 'Asia'),
('Hong Kong', 'HK', 'Asia'),
('Thailand', 'TH', 'Asia'),
('Indonesia', 'ID', 'Asia'),
('Philippines', 'PH', 'Asia'),
('Malaysia', 'MY', 'Asia'),
('Vietnam', 'VN', 'Asia'),
('Bangladesh', 'BD', 'Asia'),
('India', 'IN', 'Asia'),
('Pakistan', 'PK', 'Asia'),
('United Arab Emirates', 'AE', 'Asia'),
('Saudi Arabia', 'SA', 'Asia'),
('Iran', 'IR', 'Asia'),
('Israel', 'IL', 'Asia'),
('Iraq', 'IQ', 'Asia'),
('Kuwait', 'KW', 'Asia'),
('Qatar', 'QA', 'Asia'),
('Bahrain', 'BH', 'Asia'),
('Oman', 'OM', 'Asia'),
('Armenia', 'AM', 'Asia'),
('Georgia', 'GE', 'Asia'),
('Azerbaijan', 'AZ', 'Asia'),
('Uzbekistan', 'UZ', 'Asia'),
('Kazakhstan', 'KZ', 'Asia'),

-- Australia & Oceania
('Australia', 'AU', 'Oceania'),
('New Zealand', 'NZ', 'Oceania'),
('Fiji', 'FJ', 'Oceania'),
('Guam', 'GU', 'Oceania'),
('Northern Mariana Islands', 'MP', 'Oceania'),
('Papua New Guinea', 'PG', 'Oceania'),

-- Africa
('Egypt', 'EG', 'Africa'),
('South Africa', 'ZA', 'Africa'),
('Nigeria', 'NG', 'Africa'),
('Morocco', 'MA', 'Africa'),
('Algeria', 'DZ', 'Africa'),
('Tunisia', 'TN', 'Africa'),
('Libya', 'LY', 'Africa'),
('Sudan', 'SD', 'Africa'),
('Ethiopia', 'ET', 'Africa'),
('Kenya', 'KE', 'Africa'),
('Tanzania', 'TZ', 'Africa'),
('Uganda', 'UG', 'Africa'),
('Democratic Republic of the Congo', 'CD', 'Africa'),
('Angola', 'AO', 'Africa'),
('Zimbabwe', 'ZW', 'Africa'),
('Zambia', 'ZM', 'Africa'),
('Botswana', 'BW', 'Africa'),
('Namibia', 'NA', 'Africa'),
('Lesotho', 'LS', 'Africa'),
('Eswatini', 'SZ', 'Africa'),
('Mozambique', 'MZ', 'Africa'),
('Malawi', 'MW', 'Africa'),
('Burundi', 'BI', 'Africa'),
('Rwanda', 'RW', 'Africa'),
('Djibouti', 'DJ', 'Africa'),
('Eritrea', 'ER', 'Africa'),
('Somalia', 'SO', 'Africa'),
('Senegal', 'SN', 'Africa'),
('Mali', 'ML', 'Africa'),
('Burkina Faso', 'BF', 'Africa'),
('Ghana', 'GH', 'Africa'),
('Ivory Coast', 'CI', 'Africa'),
('Liberia', 'LR', 'Africa'),
('Sierra Leone', 'SL', 'Africa'),
('Guinea', 'GN', 'Africa'),
('Guinea-Bissau', 'GW', 'Africa'),
('Gambia', 'GM', 'Africa'),
('Mauritania', 'MR', 'Africa'),
('Western Sahara', 'EH', 'Africa'),

-- South America
('Brazil', 'BR', 'South America'),
('Argentina', 'AR', 'South America'),
('Chile', 'CL', 'South America'),
('Colombia', 'CO', 'South America'),
('Peru', 'PE', 'South America'),
('Venezuela', 'VE', 'South America'),
('Ecuador', 'EC', 'South America'),
('Bolivia', 'BO', 'South America'),
('Paraguay', 'PY', 'South America'),
('Uruguay', 'UY', 'South America'),
('Guyana', 'GY', 'South America'),
('Suriname', 'SR', 'South America'),
('French Guiana', 'GF', 'South America'),

-- Central America
('Guatemala', 'GT', 'Central America'),
('El Salvador', 'SV', 'Central America'),
('Honduras', 'HN', 'Central America'),
('Nicaragua', 'NI', 'Central America'),
('Costa Rica', 'CR', 'Central America'),
('Panama', 'PA', 'Central America'),
('Belize', 'BZ', 'Central America'),

-- Caribbean
('Cuba', 'CU', 'Caribbean'),
('Jamaica', 'JM', 'Caribbean'),
('Haiti', 'HT', 'Caribbean'),
('Dominican Republic', 'DO', 'Caribbean'),
('Puerto Rico', 'PR', 'Caribbean'),
('Trinidad and Tobago', 'TT', 'Caribbean'),
('Barbados', 'BB', 'Caribbean'),
('Grenada', 'GD', 'Caribbean'),
('Saint Lucia', 'LC', 'Caribbean'),
('Saint Vincent and the Grenadines', 'VC', 'Caribbean'),
('Antigua and Barbuda', 'AG', 'Caribbean'),
('Saint Kitts and Nevis', 'KN', 'Caribbean'),
('Dominica', 'DM', 'Caribbean'),
('Martinique', 'MQ', 'Caribbean'),
('Guadeloupe', 'GP', 'Caribbean'),

-- Global
('Global', 'GL', 'Global');

-- Insert comprehensive timezone data with country references
INSERT INTO timezones (name, display_name, offset_hours, offset_minutes, is_dst, region, country_id, city) VALUES
-- North America
('America/New_York', 'Eastern Time (ET)', -5, 0, false, 'North America', (SELECT id FROM countries WHERE code = 'US'), 'New York'),
('America/Chicago', 'Central Time (CT)', -6, 0, false, 'North America', (SELECT id FROM countries WHERE code = 'US'), 'Chicago'),
('America/Denver', 'Mountain Time (MT)', -7, 0, false, 'North America', (SELECT id FROM countries WHERE code = 'US'), 'Denver'),
('America/Los_Angeles', 'Pacific Time (PT)', -8, 0, false, 'North America', (SELECT id FROM countries WHERE code = 'US'), 'Los Angeles'),
('America/Anchorage', 'Alaska Time (AKT)', -9, 0, false, 'North America', (SELECT id FROM countries WHERE code = 'US'), 'Anchorage'),
('Pacific/Honolulu', 'Hawaii Time (HT)', -10, 0, false, 'North America', (SELECT id FROM countries WHERE code = 'US'), 'Honolulu'),
('America/Toronto', 'Eastern Time (ET)', -5, 0, false, 'North America', (SELECT id FROM countries WHERE code = 'CA'), 'Toronto'),
('America/Vancouver', 'Pacific Time (PT)', -8, 0, false, 'North America', (SELECT id FROM countries WHERE code = 'CA'), 'Vancouver'),
('America/Mexico_City', 'Central Time (CT)', -6, 0, false, 'North America', (SELECT id FROM countries WHERE code = 'MX'), 'Mexico City'),

-- Europe
('Europe/London', 'Greenwich Mean Time (GMT)', 0, 0, false, 'Europe', (SELECT id FROM countries WHERE code = 'GB'), 'London'),
('Europe/Paris', 'Central European Time (CET)', 1, 0, false, 'Europe', (SELECT id FROM countries WHERE code = 'FR'), 'Paris'),
('Europe/Berlin', 'Central European Time (CET)', 1, 0, false, 'Europe', (SELECT id FROM countries WHERE code = 'DE'), 'Berlin'),
('Europe/Rome', 'Central European Time (CET)', 1, 0, false, 'Europe', (SELECT id FROM countries WHERE code = 'IT'), 'Rome'),
('Europe/Madrid', 'Central European Time (CET)', 1, 0, false, 'Europe', (SELECT id FROM countries WHERE code = 'ES'), 'Madrid'),
('Europe/Amsterdam', 'Central European Time (CET)', 1, 0, false, 'Europe', (SELECT id FROM countries WHERE code = 'NL'), 'Amsterdam'),
('Europe/Stockholm', 'Central European Time (CET)', 1, 0, false, 'Europe', (SELECT id FROM countries WHERE code = 'SE'), 'Stockholm'),
('Europe/Oslo', 'Central European Time (CET)', 1, 0, false, 'Europe', (SELECT id FROM countries WHERE code = 'NO'), 'Oslo'),
('Europe/Copenhagen', 'Central European Time (CET)', 1, 0, false, 'Europe', (SELECT id FROM countries WHERE code = 'DK'), 'Copenhagen'),
('Europe/Helsinki', 'Eastern European Time (EET)', 2, 0, false, 'Europe', (SELECT id FROM countries WHERE code = 'FI'), 'Helsinki'),
('Europe/Athens', 'Eastern European Time (EET)', 2, 0, false, 'Europe', (SELECT id FROM countries WHERE code = 'GR'), 'Athens'),
('Europe/Warsaw', 'Central European Time (CET)', 1, 0, false, 'Europe', (SELECT id FROM countries WHERE code = 'PL'), 'Warsaw'),
('Europe/Prague', 'Central European Time (CET)', 1, 0, false, 'Europe', (SELECT id FROM countries WHERE code = 'CZ'), 'Prague'),
('Europe/Budapest', 'Central European Time (CET)', 1, 0, false, 'Europe', (SELECT id FROM countries WHERE code = 'HU'), 'Budapest'),
('Europe/Vienna', 'Central European Time (CET)', 1, 0, false, 'Europe', (SELECT id FROM countries WHERE code = 'AT'), 'Vienna'),
('Europe/Zurich', 'Central European Time (CET)', 1, 0, false, 'Europe', (SELECT id FROM countries WHERE code = 'CH'), 'Zurich'),
('Europe/Dublin', 'Greenwich Mean Time (GMT)', 0, 0, false, 'Europe', (SELECT id FROM countries WHERE code = 'IE'), 'Dublin'),
('Europe/Lisbon', 'Western European Time (WET)', 0, 0, false, 'Europe', (SELECT id FROM countries WHERE code = 'PT'), 'Lisbon'),
('Europe/Istanbul', 'Turkey Time (TRT)', 3, 0, false, 'Europe', (SELECT id FROM countries WHERE code = 'TR'), 'Istanbul'),
('Europe/Moscow', 'Moscow Time (MSK)', 3, 0, false, 'Europe', (SELECT id FROM countries WHERE code = 'RU'), 'Moscow'),

-- Asia
('Asia/Tokyo', 'Japan Standard Time (JST)', 9, 0, false, 'Asia', (SELECT id FROM countries WHERE code = 'JP'), 'Tokyo'),
('Asia/Shanghai', 'China Standard Time (CST)', 8, 0, false, 'Asia', (SELECT id FROM countries WHERE code = 'CN'), 'Shanghai'),
('Asia/Seoul', 'Korea Standard Time (KST)', 9, 0, false, 'Asia', (SELECT id FROM countries WHERE code = 'KR'), 'Seoul'),
('Asia/Singapore', 'Singapore Time (SGT)', 8, 0, false, 'Asia', (SELECT id FROM countries WHERE code = 'SG'), 'Singapore'),
('Asia/Hong_Kong', 'Hong Kong Time (HKT)', 8, 0, false, 'Asia', (SELECT id FROM countries WHERE code = 'HK'), 'Hong Kong'),
('Asia/Bangkok', 'Indochina Time (ICT)', 7, 0, false, 'Asia', (SELECT id FROM countries WHERE code = 'TH'), 'Bangkok'),
('Asia/Jakarta', 'Western Indonesian Time (WIB)', 7, 0, false, 'Asia', (SELECT id FROM countries WHERE code = 'ID'), 'Jakarta'),
('Asia/Manila', 'Philippine Time (PHT)', 8, 0, false, 'Asia', (SELECT id FROM countries WHERE code = 'PH'), 'Manila'),
('Asia/Kuala_Lumpur', 'Malaysia Time (MYT)', 8, 0, false, 'Asia', (SELECT id FROM countries WHERE code = 'MY'), 'Kuala Lumpur'),
('Asia/Ho_Chi_Minh', 'Indochina Time (ICT)', 7, 0, false, 'Asia', (SELECT id FROM countries WHERE code = 'VN'), 'Ho Chi Minh City'),
('Asia/Dhaka', 'Bangladesh Time (BDT)', 6, 0, false, 'Asia', (SELECT id FROM countries WHERE code = 'BD'), 'Dhaka'),
('Asia/Kolkata', 'India Standard Time (IST)', 5, 30, false, 'Asia', (SELECT id FROM countries WHERE code = 'IN'), 'Mumbai'),
('Asia/Karachi', 'Pakistan Time (PKT)', 5, 0, false, 'Asia', (SELECT id FROM countries WHERE code = 'PK'), 'Karachi'),
('Asia/Dubai', 'Gulf Standard Time (GST)', 4, 0, false, 'Asia', (SELECT id FROM countries WHERE code = 'AE'), 'Dubai'),
('Asia/Riyadh', 'Arabia Standard Time (AST)', 3, 0, false, 'Asia', (SELECT id FROM countries WHERE code = 'SA'), 'Riyadh'),
('Asia/Tehran', 'Iran Standard Time (IRST)', 3, 30, false, 'Asia', (SELECT id FROM countries WHERE code = 'IR'), 'Tehran'),
('Asia/Jerusalem', 'Israel Standard Time (IST)', 2, 0, false, 'Asia', (SELECT id FROM countries WHERE code = 'IL'), 'Jerusalem'),
('Asia/Baghdad', 'Arabia Standard Time (AST)', 3, 0, false, 'Asia', (SELECT id FROM countries WHERE code = 'IQ'), 'Baghdad'),
('Asia/Kuwait', 'Arabia Standard Time (AST)', 3, 0, false, 'Asia', (SELECT id FROM countries WHERE code = 'KW'), 'Kuwait City'),
('Asia/Qatar', 'Arabia Standard Time (AST)', 3, 0, false, 'Asia', (SELECT id FROM countries WHERE code = 'QA'), 'Doha'),
('Asia/Bahrain', 'Arabia Standard Time (AST)', 3, 0, false, 'Asia', (SELECT id FROM countries WHERE code = 'BH'), 'Manama'),
('Asia/Oman', 'Arabia Standard Time (AST)', 4, 0, false, 'Asia', (SELECT id FROM countries WHERE code = 'OM'), 'Muscat'),
('Asia/Yerevan', 'Armenia Time (AMT)', 4, 0, false, 'Asia', (SELECT id FROM countries WHERE code = 'AM'), 'Yerevan'),
('Asia/Tbilisi', 'Georgia Time (GET)', 4, 0, false, 'Asia', (SELECT id FROM countries WHERE code = 'GE'), 'Tbilisi'),
('Asia/Baku', 'Azerbaijan Time (AZT)', 4, 0, false, 'Asia', (SELECT id FROM countries WHERE code = 'AZ'), 'Baku'),
('Asia/Tashkent', 'Uzbekistan Time (UZT)', 5, 0, false, 'Asia', (SELECT id FROM countries WHERE code = 'UZ'), 'Tashkent'),
('Asia/Almaty', 'Alma-Ata Time (ALMT)', 6, 0, false, 'Asia', (SELECT id FROM countries WHERE code = 'KZ'), 'Almaty'),
('Asia/Novosibirsk', 'Novosibirsk Time (NOVT)', 7, 0, false, 'Asia', (SELECT id FROM countries WHERE code = 'RU'), 'Novosibirsk'),
('Asia/Vladivostok', 'Vladivostok Time (VLAT)', 10, 0, false, 'Asia', (SELECT id FROM countries WHERE code = 'RU'), 'Vladivostok'),
('Asia/Yekaterinburg', 'Yekaterinburg Time (YEKT)', 5, 0, false, 'Asia', (SELECT id FROM countries WHERE code = 'RU'), 'Yekaterinburg'),

-- Australia & Oceania
('Australia/Sydney', 'Australian Eastern Time (AEST)', 10, 0, false, 'Australia', (SELECT id FROM countries WHERE code = 'AU'), 'Sydney'),
('Australia/Melbourne', 'Australian Eastern Time (AEST)', 10, 0, false, 'Australia', (SELECT id FROM countries WHERE code = 'AU'), 'Melbourne'),
('Australia/Brisbane', 'Australian Eastern Time (AEST)', 10, 0, false, 'Australia', (SELECT id FROM countries WHERE code = 'AU'), 'Brisbane'),
('Australia/Perth', 'Australian Western Time (AWST)', 8, 0, false, 'Australia', (SELECT id FROM countries WHERE code = 'AU'), 'Perth'),
('Australia/Adelaide', 'Australian Central Time (ACST)', 9, 30, false, 'Australia', (SELECT id FROM countries WHERE code = 'AU'), 'Adelaide'),
('Australia/Darwin', 'Australian Central Time (ACST)', 9, 30, false, 'Australia', (SELECT id FROM countries WHERE code = 'AU'), 'Darwin'),
('Pacific/Auckland', 'New Zealand Standard Time (NZST)', 12, 0, false, 'Oceania', (SELECT id FROM countries WHERE code = 'NZ'), 'Auckland'),
('Pacific/Fiji', 'Fiji Time (FJT)', 12, 0, false, 'Oceania', (SELECT id FROM countries WHERE code = 'FJ'), 'Suva'),
('Pacific/Guam', 'Chamorro Standard Time (ChST)', 10, 0, false, 'Oceania', (SELECT id FROM countries WHERE code = 'GU'), 'Hagåtña'),
('Pacific/Saipan', 'Chamorro Standard Time (ChST)', 10, 0, false, 'Oceania', (SELECT id FROM countries WHERE code = 'MP'), 'Saipan'),
('Pacific/Port_Moresby', 'Papua New Guinea Time (PGT)', 10, 0, false, 'Oceania', (SELECT id FROM countries WHERE code = 'PG'), 'Port Moresby'),

-- Africa
('Africa/Cairo', 'Eastern European Time (EET)', 2, 0, false, 'Africa', (SELECT id FROM countries WHERE code = 'EG'), 'Cairo'),
('Africa/Johannesburg', 'South Africa Standard Time (SAST)', 2, 0, false, 'Africa', (SELECT id FROM countries WHERE code = 'ZA'), 'Johannesburg'),
('Africa/Lagos', 'West Africa Time (WAT)', 1, 0, false, 'Africa', (SELECT id FROM countries WHERE code = 'NG'), 'Lagos'),
('Africa/Casablanca', 'Western European Time (WET)', 0, 0, false, 'Africa', (SELECT id FROM countries WHERE code = 'MA'), 'Casablanca'),
('Africa/Algiers', 'Central European Time (CET)', 1, 0, false, 'Africa', (SELECT id FROM countries WHERE code = 'DZ'), 'Algiers'),
('Africa/Tunis', 'Central European Time (CET)', 1, 0, false, 'Africa', (SELECT id FROM countries WHERE code = 'TN'), 'Tunis'),
('Africa/Tripoli', 'Eastern European Time (EET)', 2, 0, false, 'Africa', (SELECT id FROM countries WHERE code = 'LY'), 'Tripoli'),
('Africa/Khartoum', 'Central Africa Time (CAT)', 2, 0, false, 'Africa', (SELECT id FROM countries WHERE code = 'SD'), 'Khartoum'),
('Africa/Addis_Ababa', 'East Africa Time (EAT)', 3, 0, false, 'Africa', (SELECT id FROM countries WHERE code = 'ET'), 'Addis Ababa'),
('Africa/Nairobi', 'East Africa Time (EAT)', 3, 0, false, 'Africa', (SELECT id FROM countries WHERE code = 'KE'), 'Nairobi'),
('Africa/Dar_es_Salaam', 'East Africa Time (EAT)', 3, 0, false, 'Africa', (SELECT id FROM countries WHERE code = 'TZ'), 'Dar es Salaam'),
('Africa/Kampala', 'East Africa Time (EAT)', 3, 0, false, 'Africa', (SELECT id FROM countries WHERE code = 'UG'), 'Kampala'),
('Africa/Kinshasa', 'West Africa Time (WAT)', 1, 0, false, 'Africa', (SELECT id FROM countries WHERE code = 'CD'), 'Kinshasa'),
('Africa/Luanda', 'West Africa Time (WAT)', 1, 0, false, 'Africa', (SELECT id FROM countries WHERE code = 'AO'), 'Luanda'),
('Africa/Harare', 'Central Africa Time (CAT)', 2, 0, false, 'Africa', (SELECT id FROM countries WHERE code = 'ZW'), 'Harare'),
('Africa/Lusaka', 'Central Africa Time (CAT)', 2, 0, false, 'Africa', (SELECT id FROM countries WHERE code = 'ZM'), 'Lusaka'),
('Africa/Gaborone', 'Central Africa Time (CAT)', 2, 0, false, 'Africa', (SELECT id FROM countries WHERE code = 'BW'), 'Gaborone'),
('Africa/Windhoek', 'Central Africa Time (CAT)', 2, 0, false, 'Africa', (SELECT id FROM countries WHERE code = 'NA'), 'Windhoek'),
('Africa/Maseru', 'South Africa Standard Time (SAST)', 2, 0, false, 'Africa', (SELECT id FROM countries WHERE code = 'LS'), 'Maseru'),
('Africa/Mbabane', 'South Africa Standard Time (SAST)', 2, 0, false, 'Africa', (SELECT id FROM countries WHERE code = 'SZ'), 'Mbabane'),
('Africa/Maputo', 'Central Africa Time (CAT)', 2, 0, false, 'Africa', (SELECT id FROM countries WHERE code = 'MZ'), 'Maputo'),
('Africa/Blantyre', 'Central Africa Time (CAT)', 2, 0, false, 'Africa', (SELECT id FROM countries WHERE code = 'MW'), 'Blantyre'),
('Africa/Bujumbura', 'Central Africa Time (CAT)', 2, 0, false, 'Africa', (SELECT id FROM countries WHERE code = 'BI'), 'Bujumbura'),
('Africa/Kigali', 'Central Africa Time (CAT)', 2, 0, false, 'Africa', (SELECT id FROM countries WHERE code = 'RW'), 'Kigali'),
('Africa/Djibouti', 'East Africa Time (EAT)', 3, 0, false, 'Africa', (SELECT id FROM countries WHERE code = 'DJ'), 'Djibouti'),
('Africa/Asmara', 'East Africa Time (EAT)', 3, 0, false, 'Africa', (SELECT id FROM countries WHERE code = 'ER'), 'Asmara'),
('Africa/Mogadishu', 'East Africa Time (EAT)', 3, 0, false, 'Africa', (SELECT id FROM countries WHERE code = 'SO'), 'Mogadishu'),
('Africa/Dakar', 'Greenwich Mean Time (GMT)', 0, 0, false, 'Africa', (SELECT id FROM countries WHERE code = 'SN'), 'Dakar'),
('Africa/Bamako', 'Greenwich Mean Time (GMT)', 0, 0, false, 'Africa', (SELECT id FROM countries WHERE code = 'ML'), 'Bamako'),
('Africa/Ouagadougou', 'Greenwich Mean Time (GMT)', 0, 0, false, 'Africa', (SELECT id FROM countries WHERE code = 'BF'), 'Ouagadougou'),
('Africa/Accra', 'Greenwich Mean Time (GMT)', 0, 0, false, 'Africa', (SELECT id FROM countries WHERE code = 'GH'), 'Accra'),
('Africa/Abidjan', 'Greenwich Mean Time (GMT)', 0, 0, false, 'Africa', (SELECT id FROM countries WHERE code = 'CI'), 'Abidjan'),
('Africa/Monrovia', 'Greenwich Mean Time (GMT)', 0, 0, false, 'Africa', (SELECT id FROM countries WHERE code = 'LR'), 'Monrovia'),
('Africa/Freetown', 'Greenwich Mean Time (GMT)', 0, 0, false, 'Africa', (SELECT id FROM countries WHERE code = 'SL'), 'Freetown'),
('Africa/Conakry', 'Greenwich Mean Time (GMT)', 0, 0, false, 'Africa', (SELECT id FROM countries WHERE code = 'GN'), 'Conakry'),
('Africa/Bissau', 'Greenwich Mean Time (GMT)', 0, 0, false, 'Africa', (SELECT id FROM countries WHERE code = 'GW'), 'Bissau'),
('Africa/Banjul', 'Greenwich Mean Time (GMT)', 0, 0, false, 'Africa', (SELECT id FROM countries WHERE code = 'GM'), 'Banjul'),
('Africa/Nouakchott', 'Greenwich Mean Time (GMT)', 0, 0, false, 'Africa', (SELECT id FROM countries WHERE code = 'MR'), 'Nouakchott'),
('Africa/El_Aaiun', 'Greenwich Mean Time (GMT)', 0, 0, false, 'Africa', (SELECT id FROM countries WHERE code = 'EH'), 'El Aaiun'),

-- South America
('America/Sao_Paulo', 'Brasília Time (BRT)', -3, 0, false, 'South America', (SELECT id FROM countries WHERE code = 'BR'), 'São Paulo'),
('America/Rio_Branco', 'Acre Time (ACT)', -5, 0, false, 'South America', (SELECT id FROM countries WHERE code = 'BR'), 'Rio Branco'),
('America/Manaus', 'Amazon Time (AMT)', -4, 0, false, 'South America', (SELECT id FROM countries WHERE code = 'BR'), 'Manaus'),
('America/Belem', 'Brasília Time (BRT)', -3, 0, false, 'South America', (SELECT id FROM countries WHERE code = 'BR'), 'Belém'),
('America/Fortaleza', 'Brasília Time (BRT)', -3, 0, false, 'South America', (SELECT id FROM countries WHERE code = 'BR'), 'Fortaleza'),
('America/Recife', 'Brasília Time (BRT)', -3, 0, false, 'South America', (SELECT id FROM countries WHERE code = 'BR'), 'Recife'),
('America/Noronha', 'Fernando de Noronha Time (FNT)', -2, 0, false, 'South America', (SELECT id FROM countries WHERE code = 'BR'), 'Fernando de Noronha'),
('America/Argentina/Buenos_Aires', 'Argentina Time (ART)', -3, 0, false, 'South America', (SELECT id FROM countries WHERE code = 'AR'), 'Buenos Aires'),
('America/Chile/Santiago', 'Chile Time (CLT)', -3, 0, false, 'South America', (SELECT id FROM countries WHERE code = 'CL'), 'Santiago'),
('America/Colombia/Bogota', 'Colombia Time (COT)', -5, 0, false, 'South America', (SELECT id FROM countries WHERE code = 'CO'), 'Bogotá'),
('America/Peru/Lima', 'Peru Time (PET)', -5, 0, false, 'South America', (SELECT id FROM countries WHERE code = 'PE'), 'Lima'),
('America/Venezuela/Caracas', 'Venezuela Time (VET)', -4, 0, false, 'South America', (SELECT id FROM countries WHERE code = 'VE'), 'Caracas'),
('America/Ecuador/Quito', 'Ecuador Time (ECT)', -5, 0, false, 'South America', (SELECT id FROM countries WHERE code = 'EC'), 'Quito'),
('America/Bolivia/La_Paz', 'Bolivia Time (BOT)', -4, 0, false, 'South America', (SELECT id FROM countries WHERE code = 'BO'), 'La Paz'),
('America/Paraguay/Asuncion', 'Paraguay Time (PYT)', -4, 0, false, 'South America', (SELECT id FROM countries WHERE code = 'PY'), 'Asunción'),
('America/Uruguay/Montevideo', 'Uruguay Time (UYT)', -3, 0, false, 'South America', (SELECT id FROM countries WHERE code = 'UY'), 'Montevideo'),
('America/Guyana/Georgetown', 'Guyana Time (GYT)', -4, 0, false, 'South America', (SELECT id FROM countries WHERE code = 'GY'), 'Georgetown'),
('America/Suriname/Paramaribo', 'Suriname Time (SRT)', -3, 0, false, 'South America', (SELECT id FROM countries WHERE code = 'SR'), 'Paramaribo'),
('America/French_Guiana/Cayenne', 'French Guiana Time (GFT)', -3, 0, false, 'South America', (SELECT id FROM countries WHERE code = 'GF'), 'Cayenne'),

-- Central America
('America/Guatemala', 'Central Time (CT)', -6, 0, false, 'Central America', (SELECT id FROM countries WHERE code = 'GT'), 'Guatemala City'),
('America/El_Salvador/San_Salvador', 'Central Time (CT)', -6, 0, false, 'Central America', (SELECT id FROM countries WHERE code = 'SV'), 'San Salvador'),
('America/Honduras/Tegucigalpa', 'Central Time (CT)', -6, 0, false, 'Central America', (SELECT id FROM countries WHERE code = 'HN'), 'Tegucigalpa'),
('America/Nicaragua/Managua', 'Central Time (CT)', -6, 0, false, 'Central America', (SELECT id FROM countries WHERE code = 'NI'), 'Managua'),
('America/Costa_Rica/San_Jose', 'Central Time (CT)', -6, 0, false, 'Central America', (SELECT id FROM countries WHERE code = 'CR'), 'San José'),
('America/Panama/Panama', 'Eastern Time (ET)', -5, 0, false, 'Central America', (SELECT id FROM countries WHERE code = 'PA'), 'Panama City'),
('America/Belize/Belize', 'Central Time (CT)', -6, 0, false, 'Central America', (SELECT id FROM countries WHERE code = 'BZ'), 'Belmopan'),

-- Caribbean
('America/Cuba/Havana', 'Cuba Time (CST)', -5, 0, false, 'Caribbean', (SELECT id FROM countries WHERE code = 'CU'), 'Havana'),
('America/Jamaica/Kingston', 'Eastern Time (ET)', -5, 0, false, 'Caribbean', (SELECT id FROM countries WHERE code = 'JM'), 'Kingston'),
('America/Haiti/Port-au-Prince', 'Eastern Time (ET)', -5, 0, false, 'Caribbean', (SELECT id FROM countries WHERE code = 'HT'), 'Port-au-Prince'),
('America/Dominican_Republic/Santo_Domingo', 'Eastern Time (ET)', -4, 0, false, 'Caribbean', (SELECT id FROM countries WHERE code = 'DO'), 'Santo Domingo'),
('America/Puerto_Rico/San_Juan', 'Atlantic Time (AST)', -4, 0, false, 'Caribbean', (SELECT id FROM countries WHERE code = 'PR'), 'San Juan'),
('America/Trinidad_and_Tobago/Port_of_Spain', 'Atlantic Time (AST)', -4, 0, false, 'Caribbean', (SELECT id FROM countries WHERE code = 'TT'), 'Port of Spain'),
('America/Barbados/Bridgetown', 'Atlantic Time (AST)', -4, 0, false, 'Caribbean', (SELECT id FROM countries WHERE code = 'BB'), 'Bridgetown'),
('America/Grenada/St_Georges', 'Atlantic Time (AST)', -4, 0, false, 'Caribbean', (SELECT id FROM countries WHERE code = 'GD'), 'St. George''s'),
('America/St_Lucia/Castries', 'Atlantic Time (AST)', -4, 0, false, 'Caribbean', (SELECT id FROM countries WHERE code = 'LC'), 'Castries'),
('America/St_Vincent/Kingstown', 'Atlantic Time (AST)', -4, 0, false, 'Caribbean', (SELECT id FROM countries WHERE code = 'VC'), 'Kingstown'),
('America/Antigua_and_Barbuda/St_Johns', 'Atlantic Time (AST)', -4, 0, false, 'Caribbean', (SELECT id FROM countries WHERE code = 'AG'), 'St. John''s'),
('America/St_Kitts_and_Nevis/Basseterre', 'Atlantic Time (AST)', -4, 0, false, 'Caribbean', (SELECT id FROM countries WHERE code = 'KN'), 'Basseterre'),
('America/Dominica/Roseau', 'Atlantic Time (AST)', -4, 0, false, 'Caribbean', (SELECT id FROM countries WHERE code = 'DM'), 'Roseau'),
('America/Martinique/Fort-de-France', 'Atlantic Time (AST)', -4, 0, false, 'Caribbean', (SELECT id FROM countries WHERE code = 'MQ'), 'Fort-de-France'),
('America/Guadeloupe/Basse-Terre', 'Atlantic Time (AST)', -4, 0, false, 'Caribbean', (SELECT id FROM countries WHERE code = 'GP'), 'Basse-Terre'),

-- UTC and GMT
('UTC', 'Coordinated Universal Time (UTC)', 0, 0, false, 'Global', (SELECT id FROM countries WHERE code = 'GL'), 'UTC'),
('GMT', 'Greenwich Mean Time (GMT)', 0, 0, false, 'Global', (SELECT id FROM countries WHERE code = 'GL'), 'Greenwich');

-- Add comments to the tables and columns
COMMENT ON TABLE countries IS 'List of countries with their codes and continents';
COMMENT ON COLUMN countries.name IS 'Full country name';
COMMENT ON COLUMN countries.code IS 'ISO 3166-1 alpha-2 country code';
COMMENT ON COLUMN countries.continent IS 'Continent where the country is located';

COMMENT ON TABLE timezones IS 'Comprehensive list of world timezones with display information';
COMMENT ON COLUMN timezones.name IS 'IANA timezone identifier (e.g., America/New_York)';
COMMENT ON COLUMN timezones.display_name IS 'Human-readable timezone name with abbreviation';
COMMENT ON COLUMN timezones.offset_hours IS 'Offset from UTC in hours';
COMMENT ON COLUMN timezones.offset_minutes IS 'Additional offset in minutes (for half-hour timezones)';
COMMENT ON COLUMN timezones.is_dst IS 'Whether this timezone observes daylight saving time';
COMMENT ON COLUMN timezones.region IS 'Geographic region (North America, Europe, Asia, etc.)';
COMMENT ON COLUMN timezones.country_id IS 'Reference to countries table';
COMMENT ON COLUMN timezones.city IS 'Major city in this timezone'; 