-- Migration: Complete analytics calculation functions and triggers setup
-- This migration adds all missing calculation functions and triggers for candidate analytics

-- ============================================================================
-- PART 1: Create trigger function for automatic analytics updates
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_candidate_analytics_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Update candidate analytics when responses change
    IF TG_TABLE_NAME = 'responses' THEN
        PERFORM calculate_candidate_analytics(NEW.candidate_id, 
            (SELECT job_id FROM candidates WHERE id = NEW.candidate_id));
        PERFORM calculate_response_analytics(NEW.id);
    END IF;
    
    -- Update candidate analytics when evaluations change
    IF TG_TABLE_NAME = 'evaluations' THEN
        PERFORM calculate_candidate_analytics(NEW.candidate_id, 
            (SELECT job_id FROM candidates WHERE id = NEW.candidate_id));
    END IF;
    
    -- Update candidate analytics when AI evaluations change
    IF TG_TABLE_NAME = 'ai_evaluations' THEN
        PERFORM calculate_candidate_analytics(NEW.candidate_id, NEW.job_id);
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 2: Create triggers
-- ============================================================================

-- Create triggers for responses
DROP TRIGGER IF EXISTS trigger_candidate_analytics_responses ON responses;
CREATE TRIGGER trigger_candidate_analytics_responses
    AFTER INSERT OR UPDATE ON responses
    FOR EACH ROW
    EXECUTE FUNCTION trigger_candidate_analytics_update();

-- Create triggers for evaluations
DROP TRIGGER IF EXISTS trigger_candidate_analytics_evaluations ON evaluations;
CREATE TRIGGER trigger_candidate_analytics_evaluations
    AFTER INSERT OR UPDATE ON evaluations
    FOR EACH ROW
    EXECUTE FUNCTION trigger_candidate_analytics_update();

-- Create triggers for AI evaluations
DROP TRIGGER IF EXISTS trigger_candidate_analytics_ai_evaluations ON ai_evaluations;
CREATE TRIGGER trigger_candidate_analytics_ai_evaluations
    AFTER INSERT OR UPDATE ON ai_evaluations
    FOR EACH ROW
    EXECUTE FUNCTION trigger_candidate_analytics_update(); 