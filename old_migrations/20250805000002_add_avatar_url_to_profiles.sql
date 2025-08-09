-- Migration: Add avatar_url column to profiles table
-- Description: Add avatar_url field to store user profile pictures

-- Add avatar_url column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN avatar_url TEXT;

-- Add comment for the new column
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL to user profile picture stored in Supabase Storage'; 