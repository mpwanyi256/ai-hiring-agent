-- Add attachment fields to messages table if they don't exist
DO $$
BEGIN
    -- Add attachment_url column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'messages' AND column_name = 'attachment_url') THEN
        ALTER TABLE public.messages ADD COLUMN attachment_url TEXT;
    END IF;

    -- Add attachment_name column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'messages' AND column_name = 'attachment_name') THEN
        ALTER TABLE public.messages ADD COLUMN attachment_name TEXT;
    END IF;

    -- Add attachment_size column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'messages' AND column_name = 'attachment_size') THEN
        ALTER TABLE public.messages ADD COLUMN attachment_size INTEGER;
    END IF;

    -- Add attachment_type column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'messages' AND column_name = 'attachment_type') THEN
        ALTER TABLE public.messages ADD COLUMN attachment_type TEXT;
    END IF;

    -- Add edited_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'messages' AND column_name = 'edited_at') THEN
        ALTER TABLE public.messages ADD COLUMN edited_at TIMESTAMP WITH TIME ZONE;
    END IF;
END
$$; 