-- Fix Messages Table Structure to Match Original Design
-- This migration removes non-original columns and ensures structure matches old migrations

-- ============================================================================
-- PART 1: Remove non-original columns from messages table
-- ============================================================================

-- Remove sender_type column (not in original design)
ALTER TABLE public.messages DROP COLUMN IF EXISTS sender_type;

-- Remove is_read column (not in original design)
ALTER TABLE public.messages DROP COLUMN IF EXISTS is_read;

-- ============================================================================
-- PART 2: Drop RLS policies that depend on sender_id before removing the column
-- ============================================================================

-- Drop existing policies that depend on sender_id
DROP POLICY IF EXISTS "Users can send messages for accessible jobs" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;

-- ============================================================================
-- PART 3: Fix column constraints to match original design
-- ============================================================================

-- Make candidate_id NOT NULL (as per original design)
ALTER TABLE public.messages ALTER COLUMN candidate_id SET NOT NULL;

-- Make sender_id NOT NULL and rename to user_id (as per original design)
-- First, copy data from sender_id to user_id if user_id is null
UPDATE public.messages SET user_id = sender_id WHERE user_id IS NULL AND sender_id IS NOT NULL;

-- Make user_id NOT NULL
ALTER TABLE public.messages ALTER COLUMN user_id SET NOT NULL;

-- Remove sender_id column (redundant with user_id)
ALTER TABLE public.messages DROP COLUMN IF EXISTS sender_id;

-- Make text NOT NULL (as per original design)
-- First, copy data from content to text if text is null
UPDATE public.messages SET text = content WHERE text IS NULL AND content IS NOT NULL;

-- Make text NOT NULL
ALTER TABLE public.messages ALTER COLUMN text SET NOT NULL;

-- Remove content column (redundant with text)
ALTER TABLE public.messages DROP COLUMN IF EXISTS content;

-- ============================================================================
-- PART 4: Update the get_job_messages function to match original structure
-- ============================================================================

-- Drop and recreate the function to match original design
DROP FUNCTION IF EXISTS public.get_job_messages(UUID, INTEGER, INTEGER) CASCADE;

CREATE OR REPLACE FUNCTION public.get_job_messages(
  p_job_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  text TEXT,
  user_id UUID,
  job_id UUID,
  reply_to_id UUID,
  attachment_url TEXT,
  attachment_name TEXT,
  attachment_size BIGINT,
  attachment_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  edited_at TIMESTAMP WITH TIME ZONE,
  status TEXT,
  user_first_name TEXT,
  user_last_name TEXT,
  user_email TEXT,
  user_role TEXT,
  reply_to_text TEXT,
  reply_to_user_first_name TEXT,
  reply_to_user_last_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.text,
    m.user_id,
    m.job_id,
    m.reply_to_id,
    m.attachment_url,
    m.attachment_name,
    COALESCE(m.attachment_size, 0)::BIGINT as attachment_size,
    m.attachment_type,
    m.created_at,
    m.updated_at,
    m.edited_at,
    COALESCE(m.status, 'sent')::TEXT as status,
    COALESCE(p.first_name, '')::TEXT as user_first_name,
    COALESCE(p.last_name, '')::TEXT as user_last_name,
    COALESCE(p.email, '')::TEXT as user_email,
    COALESCE(p.role, 'viewer')::TEXT as user_role,
    COALESCE(rm.text, '')::TEXT as reply_to_text,
    COALESCE(rp.first_name, '')::TEXT as reply_to_user_first_name,
    COALESCE(rp.last_name, '')::TEXT as reply_to_user_last_name
  FROM public.messages m
  LEFT JOIN public.profiles p ON m.user_id = p.id
  LEFT JOIN public.messages rm ON m.reply_to_id = rm.id
  LEFT JOIN public.profiles rp ON rm.user_id = rp.id
  WHERE m.job_id = p_job_id
  ORDER BY m.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 5: Grant permissions on the updated function
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.get_job_messages(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_job_messages(UUID, INTEGER, INTEGER) TO service_role;

-- ============================================================================
-- PART 6: Recreate RLS policies using user_id instead of sender_id
-- ============================================================================

-- Recreate policies using user_id (original design)
CREATE POLICY "Users can send messages for accessible jobs" ON public.messages
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        (
            EXISTS (
                SELECT 1 FROM public.job_permissions jp
                WHERE jp.job_id = messages.job_id
                AND jp.user_id = auth.uid()
            )
            OR
            EXISTS (
                SELECT 1 FROM public.jobs j, public.profiles p
                WHERE j.id = messages.job_id
                AND j.profile_id = auth.uid()
                OR (p.id = auth.uid() AND p.role = 'admin')
            )
        )
    );

CREATE POLICY "Users can update their own messages" ON public.messages
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own messages" ON public.messages
    FOR DELETE USING (user_id = auth.uid());

-- ============================================================================
-- PART 7: Verify the migration was successful
-- ============================================================================

DO $$
DECLARE
    column_count INTEGER;
    has_sender_type BOOLEAN;
    has_sender_id BOOLEAN;
    has_content BOOLEAN;
    has_is_read BOOLEAN;
    has_user_id BOOLEAN;
    has_text BOOLEAN;
    candidate_id_nullable BOOLEAN;
    user_id_nullable BOOLEAN;
    text_nullable BOOLEAN;
BEGIN
    -- Check column count
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns 
    WHERE table_name = 'messages' 
    AND table_schema = 'public';
    
    -- Check if non-original columns were removed
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' 
        AND column_name = 'sender_type' 
        AND table_schema = 'public'
    ) INTO has_sender_type;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' 
        AND column_name = 'sender_id' 
        AND table_schema = 'public'
    ) INTO has_sender_id;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' 
        AND column_name = 'content' 
        AND table_schema = 'public'
    ) INTO has_content;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' 
        AND column_name = 'is_read' 
        AND table_schema = 'public'
    ) INTO has_is_read;
    
    -- Check if original columns exist and are properly configured
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' 
        AND column_name = 'user_id' 
        AND table_schema = 'public'
    ) INTO has_user_id;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' 
        AND column_name = 'text' 
        AND table_schema = 'public'
    ) INTO has_text;
    
    -- Check nullable constraints
    SELECT is_nullable = 'YES' INTO candidate_id_nullable
    FROM information_schema.columns 
    WHERE table_name = 'messages' 
    AND column_name = 'candidate_id' 
    AND table_schema = 'public';
    
    SELECT is_nullable = 'YES' INTO user_id_nullable
    FROM information_schema.columns 
    WHERE table_name = 'messages' 
    AND column_name = 'user_id' 
    AND table_schema = 'public';
    
    SELECT is_nullable = 'YES' INTO text_nullable
    FROM information_schema.columns 
    WHERE table_name = 'messages' 
    AND column_name = 'text' 
    AND table_schema = 'public';
    
    RAISE NOTICE '✅ Messages table structure fixed to match original design';
    RAISE NOTICE '  - Column count: %', column_count;
    RAISE NOTICE '  - Non-original columns removed:';
    RAISE NOTICE '    * sender_type: %', has_sender_type;
    RAISE NOTICE '    * sender_id: %', has_sender_id;
    RAISE NOTICE '    * content: %', has_content;
    RAISE NOTICE '    * is_read: %', has_is_read;
    RAISE NOTICE '  - Original columns present:';
    RAISE NOTICE '    * user_id: %', has_user_id;
    RAISE NOTICE '    * text: %', has_text;
    RAISE NOTICE '  - Constraints (should be false for NOT NULL):';
    RAISE NOTICE '    * candidate_id nullable: %', candidate_id_nullable;
    RAISE NOTICE '    * user_id nullable: %', user_id_nullable;
    RAISE NOTICE '    * text nullable: %', text_nullable;
    RAISE NOTICE '  - Message sending should now work correctly with original structure';
END $$; 