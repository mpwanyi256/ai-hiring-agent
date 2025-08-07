-- Fix Message Reactions Constraint Migration
-- This migration removes the old check constraint and creates a new one for the emoji column

-- ============================================================================
-- PART 1: Drop the old check constraint that references reaction_type
-- ============================================================================

-- Drop the old check constraint if it exists
DO $$
BEGIN
    ALTER TABLE public.message_reactions DROP CONSTRAINT IF EXISTS message_reactions_reaction_type_check;
EXCEPTION WHEN OTHERS THEN
    NULL; -- Ignore if constraint doesn't exist
END $$;

-- ============================================================================
-- PART 2: Create a new check constraint for the emoji column
-- ============================================================================

-- Add a check constraint to ensure emoji is not empty
ALTER TABLE public.message_reactions 
ADD CONSTRAINT message_reactions_emoji_check 
CHECK (emoji IS NOT NULL AND length(trim(emoji)) > 0);

-- ============================================================================
-- PART 3: Verify the fix
-- ============================================================================

DO $$
DECLARE
    old_constraint_exists BOOLEAN;
    new_constraint_exists BOOLEAN;
    emoji_column_exists BOOLEAN;
BEGIN
    -- Check if old constraint still exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'message_reactions_reaction_type_check'
        AND constraint_schema = 'public'
    ) INTO old_constraint_exists;
    
    -- Check if new constraint exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'message_reactions_emoji_check'
        AND constraint_schema = 'public'
    ) INTO new_constraint_exists;
    
    -- Check if emoji column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'message_reactions' 
        AND table_schema = 'public' 
        AND column_name = 'emoji'
    ) INTO emoji_column_exists;
    
    RAISE NOTICE '✅ Message reactions constraint fix applied';
    RAISE NOTICE '  - Old constraint exists: %', old_constraint_exists;
    RAISE NOTICE '  - New constraint exists: %', new_constraint_exists;
    RAISE NOTICE '  - Emoji column exists: %', emoji_column_exists;
    
    IF NOT old_constraint_exists AND new_constraint_exists AND emoji_column_exists THEN
        RAISE NOTICE '  - ✅ All constraint fixes applied successfully';
        RAISE NOTICE '  - Message reactions should now work properly';
    ELSE
        RAISE NOTICE '  - ⚠️  Some issues may remain, check manually';
    END IF;
END $$; 