-- Add currency field in subscriptions table with a default value of 'usd'
ALTER TABLE subscriptions ADD COLUMN currency VARCHAR(255) DEFAULT 'usd';
