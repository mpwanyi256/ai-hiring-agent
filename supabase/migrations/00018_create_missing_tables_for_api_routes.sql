-- Create Missing Tables for API Routes Migration
-- This migration creates all missing tables that are referenced in API routes

-- ============================================================================
-- PART 1: Create webhook_logs table (required by Stripe webhook)
-- ============================================================================

CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL CHECK (status IN ('success', 'error')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for webhook_logs
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type ON webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON webhook_logs(status);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at);

-- ============================================================================
-- PART 2: Create employment table (required by employment API)
-- ============================================================================

CREATE TABLE IF NOT EXISTS employment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    candidate_id UUID REFERENCES candidates(id) ON DELETE SET NULL,
    contract_offer_id UUID REFERENCES contract_offers(id) ON DELETE SET NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    employment_type_id UUID REFERENCES employment_types(id) ON DELETE SET NULL,
    
    -- Employee details
    employee_id TEXT UNIQUE,
    position_title TEXT NOT NULL,
    hire_date DATE NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    termination_date DATE,
    termination_reason TEXT,
    
    -- Employment status
    is_active BOOLEAN DEFAULT true,
    employment_status TEXT DEFAULT 'active' CHECK (employment_status IN ('active', 'terminated', 'on_leave', 'suspended')),
    
    -- Compensation details
    salary_amount DECIMAL(12,2),
    salary_currency TEXT DEFAULT 'USD',
    pay_frequency TEXT DEFAULT 'monthly' CHECK (pay_frequency IN ('hourly', 'weekly', 'biweekly', 'monthly', 'annually')),
    
    -- Work details
    work_location TEXT,
    reporting_manager_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    work_schedule TEXT,
    is_remote BOOLEAN DEFAULT false,
    
    -- Benefits and PTO
    vacation_days_allocated INTEGER DEFAULT 0,
    vacation_days_used INTEGER DEFAULT 0,
    sick_days_allocated INTEGER DEFAULT 0,
    sick_days_used INTEGER DEFAULT 0,
    
    -- Performance and notes
    performance_rating DECIMAL(3,2),
    notes TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for employment
CREATE INDEX IF NOT EXISTS idx_employment_profile_id ON employment(profile_id);
CREATE INDEX IF NOT EXISTS idx_employment_candidate_id ON employment(candidate_id);
CREATE INDEX IF NOT EXISTS idx_employment_department_id ON employment(department_id);
CREATE INDEX IF NOT EXISTS idx_employment_employment_type_id ON employment(employment_type_id);
CREATE INDEX IF NOT EXISTS idx_employment_employee_id ON employment(employee_id);
CREATE INDEX IF NOT EXISTS idx_employment_is_active ON employment(is_active);
CREATE INDEX IF NOT EXISTS idx_employment_hire_date ON employment(hire_date);
CREATE INDEX IF NOT EXISTS idx_employment_employment_status ON employment(employment_status);

-- ============================================================================
-- PART 3: Create performance_reviews table (often referenced in employment systems)
-- ============================================================================

CREATE TABLE IF NOT EXISTS performance_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employment_id UUID NOT NULL REFERENCES employment(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Review details
    review_period_start DATE NOT NULL,
    review_period_end DATE NOT NULL,
    review_type TEXT DEFAULT 'annual' CHECK (review_type IN ('annual', 'quarterly', 'probationary', 'informal', 'project')),
    
    -- Ratings and feedback
    overall_rating DECIMAL(3,2),
    goals_achievement_rating DECIMAL(3,2),
    skills_rating DECIMAL(3,2),
    communication_rating DECIMAL(3,2),
    teamwork_rating DECIMAL(3,2),
    
    -- Text feedback
    strengths TEXT,
    areas_for_improvement TEXT,
    goals_for_next_period TEXT,
    reviewer_comments TEXT,
    employee_comments TEXT,
    
    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'acknowledged')),
    completed_at TIMESTAMP WITH TIME ZONE,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance_reviews
CREATE INDEX IF NOT EXISTS idx_performance_reviews_employment_id ON performance_reviews(employment_id);
CREATE INDEX IF NOT EXISTS idx_performance_reviews_reviewer_id ON performance_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_performance_reviews_status ON performance_reviews(status);
CREATE INDEX IF NOT EXISTS idx_performance_reviews_review_period ON performance_reviews(review_period_start, review_period_end);

-- ============================================================================
-- PART 4: Create time_tracking table (for employee time management)
-- ============================================================================

CREATE TABLE IF NOT EXISTS time_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employment_id UUID NOT NULL REFERENCES employment(id) ON DELETE CASCADE,
    
    -- Time tracking details
    date DATE NOT NULL,
    clock_in_time TIMESTAMP WITH TIME ZONE,
    clock_out_time TIMESTAMP WITH TIME ZONE,
    break_start_time TIMESTAMP WITH TIME ZONE,
    break_end_time TIMESTAMP WITH TIME ZONE,
    
    -- Hours
    regular_hours DECIMAL(5,2) DEFAULT 0,
    overtime_hours DECIMAL(5,2) DEFAULT 0,
    break_hours DECIMAL(5,2) DEFAULT 0,
    total_hours DECIMAL(5,2) DEFAULT 0,
    
    -- Status and notes
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    notes TEXT,
    approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for time_tracking
CREATE INDEX IF NOT EXISTS idx_time_tracking_employment_id ON time_tracking(employment_id);
CREATE INDEX IF NOT EXISTS idx_time_tracking_date ON time_tracking(date);
CREATE INDEX IF NOT EXISTS idx_time_tracking_status ON time_tracking(status);

-- ============================================================================
-- PART 5: Create payroll table (for salary and payment tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS payroll (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employment_id UUID NOT NULL REFERENCES employment(id) ON DELETE CASCADE,
    
    -- Payroll period
    pay_period_start DATE NOT NULL,
    pay_period_end DATE NOT NULL,
    pay_date DATE NOT NULL,
    
    -- Earnings
    base_salary DECIMAL(12,2) DEFAULT 0,
    overtime_pay DECIMAL(12,2) DEFAULT 0,
    bonus DECIMAL(12,2) DEFAULT 0,
    commission DECIMAL(12,2) DEFAULT 0,
    other_earnings DECIMAL(12,2) DEFAULT 0,
    gross_pay DECIMAL(12,2) DEFAULT 0,
    
    -- Deductions
    tax_deductions DECIMAL(12,2) DEFAULT 0,
    insurance_deductions DECIMAL(12,2) DEFAULT 0,
    retirement_deductions DECIMAL(12,2) DEFAULT 0,
    other_deductions DECIMAL(12,2) DEFAULT 0,
    total_deductions DECIMAL(12,2) DEFAULT 0,
    
    -- Net pay
    net_pay DECIMAL(12,2) DEFAULT 0,
    
    -- Currency and status
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'paid', 'cancelled')),
    
    -- Payment details
    payment_method TEXT,
    payment_reference TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for payroll
CREATE INDEX IF NOT EXISTS idx_payroll_employment_id ON payroll(employment_id);
CREATE INDEX IF NOT EXISTS idx_payroll_pay_period ON payroll(pay_period_start, pay_period_end);
CREATE INDEX IF NOT EXISTS idx_payroll_pay_date ON payroll(pay_date);
CREATE INDEX IF NOT EXISTS idx_payroll_status ON payroll(status);

-- ============================================================================
-- PART 6: Add updated_at triggers for all new tables
-- ============================================================================

-- Create updated_at triggers for all new tables
CREATE TRIGGER update_webhook_logs_updated_at
    BEFORE UPDATE ON webhook_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employment_updated_at
    BEFORE UPDATE ON employment
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_performance_reviews_updated_at
    BEFORE UPDATE ON performance_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_tracking_updated_at
    BEFORE UPDATE ON time_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payroll_updated_at
    BEFORE UPDATE ON payroll
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PART 7: Enable RLS and create policies for all new tables
-- ============================================================================

-- Enable RLS for all new tables
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE employment ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;

-- RLS policies for webhook_logs (admin only)
CREATE POLICY "Admins can manage webhook logs" ON webhook_logs
  FOR ALL USING (auth.role() = 'admin' OR EXISTS(
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- RLS policies for employment (company-scoped)
CREATE POLICY "Users can view employment records for their company" ON employment
  FOR SELECT USING (
    EXISTS(
      SELECT 1 FROM profiles p1, profiles p2 
      WHERE p1.id = auth.uid() 
      AND p2.id = employment.profile_id 
      AND p1.company_id = p2.company_id
    )
  );

CREATE POLICY "HR can manage employment records for their company" ON employment
  FOR ALL USING (
    EXISTS(
      SELECT 1 FROM profiles p1, profiles p2 
      WHERE p1.id = auth.uid() 
      AND p2.id = employment.profile_id 
      AND p1.company_id = p2.company_id
      AND p1.role IN ('admin', 'hr')
    )
  );

-- RLS policies for performance_reviews (company-scoped)
CREATE POLICY "Users can view their own performance reviews" ON performance_reviews
  FOR SELECT USING (
    EXISTS(
      SELECT 1 FROM employment e 
      WHERE e.id = performance_reviews.employment_id 
      AND e.profile_id = auth.uid()
    )
  );

CREATE POLICY "Managers can manage performance reviews for their team" ON performance_reviews
  FOR ALL USING (
    EXISTS(
      SELECT 1 FROM employment e, profiles p1, profiles p2 
      WHERE e.id = performance_reviews.employment_id 
      AND p1.id = auth.uid() 
      AND p2.id = e.profile_id 
      AND p1.company_id = p2.company_id
      AND (p1.role IN ('admin', 'hr') OR performance_reviews.reviewer_id = auth.uid())
    )
  );

-- RLS policies for time_tracking (company-scoped)
CREATE POLICY "Users can manage their own time tracking" ON time_tracking
  FOR ALL USING (
    EXISTS(
      SELECT 1 FROM employment e 
      WHERE e.id = time_tracking.employment_id 
      AND e.profile_id = auth.uid()
    )
  );

CREATE POLICY "Managers can view time tracking for their company" ON time_tracking
  FOR SELECT USING (
    EXISTS(
      SELECT 1 FROM employment e, profiles p1, profiles p2 
      WHERE e.id = time_tracking.employment_id 
      AND p1.id = auth.uid() 
      AND p2.id = e.profile_id 
      AND p1.company_id = p2.company_id
      AND p1.role IN ('admin', 'hr', 'manager')
    )
  );

-- RLS policies for payroll (restricted access)
CREATE POLICY "Users can view their own payroll" ON payroll
  FOR SELECT USING (
    EXISTS(
      SELECT 1 FROM employment e 
      WHERE e.id = payroll.employment_id 
      AND e.profile_id = auth.uid()
    )
  );

CREATE POLICY "HR can manage payroll for their company" ON payroll
  FOR ALL USING (
    EXISTS(
      SELECT 1 FROM employment e, profiles p1, profiles p2 
      WHERE e.id = payroll.employment_id 
      AND p1.id = auth.uid() 
      AND p2.id = e.profile_id 
      AND p1.company_id = p2.company_id
      AND p1.role IN ('admin', 'hr')
    )
  );

-- ============================================================================
-- PART 8: Add helpful comments
-- ============================================================================

COMMENT ON TABLE webhook_logs IS 'Stores webhook event logs for debugging and audit purposes';
COMMENT ON TABLE employment IS 'Stores employee records and employment details';
COMMENT ON TABLE performance_reviews IS 'Stores employee performance review records';
COMMENT ON TABLE time_tracking IS 'Stores employee time tracking and attendance records';
COMMENT ON TABLE payroll IS 'Stores payroll and compensation records for employees'; 