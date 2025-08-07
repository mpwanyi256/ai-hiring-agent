-- Fix Message Reactions Column Migration
-- This migration renames reaction_type to emoji to match the expected structure

-- ============================================================================
-- PART 1: Rename reaction_type column to emoji
-- ============================================================================

ALTER TABLE public.message_reactions 
RENAME COLUMN reaction_type TO emoji;

-- ============================================================================
-- PART 2: Add missing unique constraint that was in the old migrations
-- ============================================================================

-- Drop existing unique constraint if it exists (it may be on reaction_type)
DO $$
BEGIN
    ALTER TABLE public.message_reactions DROP CONSTRAINT IF EXISTS message_reactions_message_id_user_id_reaction_type_key;
EXCEPTION WHEN OTHERS THEN
    NULL; -- Ignore if constraint doesn't exist
END $$;

-- Add the correct unique constraint
ALTER TABLE public.message_reactions 
ADD CONSTRAINT message_reactions_message_id_user_id_emoji_key 
UNIQUE(message_id, user_id, emoji);

-- ============================================================================
-- PART 3: Verify the fix
-- ============================================================================

DO $$
DECLARE
    emoji_column_exists BOOLEAN;
    reaction_type_column_exists BOOLEAN;
    unique_constraint_exists BOOLEAN;
BEGIN
    -- Check if emoji column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'message_reactions' 
        AND table_schema = 'public' 
        AND column_name = 'emoji'
    ) INTO emoji_column_exists;
    
    -- Check if reaction_type column still exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'message_reactions' 
        AND table_schema = 'public' 
        AND column_name = 'reaction_type'
    ) INTO reaction_type_column_exists;
    
    -- Check if unique constraint exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'message_reactions' 
        AND table_schema = 'public' 
        AND constraint_name = 'message_reactions_message_id_user_id_emoji_key'
    ) INTO unique_constraint_exists;
    
    RAISE NOTICE '✅ Message reactions column fix applied';
    RAISE NOTICE '  - Emoji column exists: %', emoji_column_exists;
    RAISE NOTICE '  - Reaction_type column exists: %', reaction_type_column_exists;
    RAISE NOTICE '  - Unique constraint exists: %', unique_constraint_exists;
    
    IF emoji_column_exists AND NOT reaction_type_column_exists AND unique_constraint_exists THEN
        RAISE NOTICE '  - ✅ All fixes applied successfully';
    ELSE
        RAISE NOTICE '  - ⚠️  Some issues may remain, check manually';
    END IF;
END $$; 