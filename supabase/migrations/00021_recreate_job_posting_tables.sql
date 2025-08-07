-- Recreate Job Posting Tables Migration
-- This migration recreates all job posting related tables with the correct structure from old migrations

-- ============================================================================
-- PART 1: Drop existing tables and views to recreate them properly
-- ============================================================================

-- Drop views first
DROP VIEW IF EXISTS public.skills_view CASCADE;
DROP VIEW IF EXISTS public.traits_view CASCADE;
DROP VIEW IF EXISTS public.job_templates_view CASCADE;

-- Drop tables in correct order (respecting foreign key dependencies)
DROP TABLE IF EXISTS public.job_templates CASCADE;
DROP TABLE IF EXISTS public.skills CASCADE;
DROP TABLE IF EXISTS public.traits CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.job_titles CASCADE;
DROP TABLE IF EXISTS public.departments CASCADE;
DROP TABLE IF EXISTS public.employment_types CASCADE;

-- ============================================================================
-- PART 2: Create categories table with proper structure
-- ============================================================================

CREATE TABLE public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('skill', 'trait')),
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PART 3: Create departments table
-- ============================================================================

CREATE TABLE public.departments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PART 4: Create job_titles table
-- ============================================================================

CREATE TABLE public.job_titles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT job_titles_name_company_unique UNIQUE (name, company_id)
);

-- ============================================================================
-- PART 5: Create employment_types table
-- ============================================================================

CREATE TABLE public.employment_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PART 6: Create skills table
-- ============================================================================

CREATE TABLE public.skills (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    description TEXT,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PART 7: Create traits table
-- ============================================================================

CREATE TABLE public.traits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    description TEXT,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PART 8: Create job_templates table
-- ============================================================================

CREATE TABLE public.job_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    title VARCHAR(300),
    description TEXT,
    requirements TEXT,
    template_data JSONB,
    fields JSONB,
    interview_format VARCHAR(20) DEFAULT 'text',
    is_public BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_template_name_per_user UNIQUE (user_id, name)
);

-- ============================================================================
-- PART 9: Insert default data
-- ============================================================================

-- Insert skill categories
INSERT INTO public.categories (name, type, description, sort_order) VALUES
    ('programming', 'skill', 'Programming languages and core coding skills', 1),
    ('frontend', 'skill', 'Frontend development frameworks and technologies', 2),
    ('backend', 'skill', 'Backend development frameworks and server technologies', 3),
    ('database', 'skill', 'Database management and data storage technologies', 4),
    ('devops', 'skill', 'DevOps, deployment, and infrastructure tools', 5),
    ('cloud', 'skill', 'Cloud platforms and services', 6),
    ('tools', 'skill', 'Development tools and utilities', 7),
    ('architecture', 'skill', 'Software architecture and system design', 8),
    ('ai', 'skill', 'Artificial intelligence and machine learning', 9),
    ('data', 'skill', 'Data analysis and data science', 10),
    ('quality_assurance', 'skill', 'Quality assurance and testing', 11),
    ('design', 'skill', 'UI/UX design and user experience', 12),
    ('mobile', 'skill', 'Mobile application development', 13),
    ('management', 'skill', 'Project and team management', 14),
    ('leadership_skills', 'skill', 'Leadership and mentoring skills', 15),
    ('soft_skills', 'skill', 'Soft skills and interpersonal abilities', 16),
    ('methodology', 'skill', 'Development methodologies and practices', 17);

-- Insert trait categories
INSERT INTO public.categories (name, type, description, sort_order) VALUES
    ('work_style', 'trait', 'Individual work preferences and habits', 1),
    ('collaboration', 'trait', 'Team collaboration and interpersonal skills', 2),
    ('personality', 'trait', 'Core personality characteristics', 3),
    ('performance', 'trait', 'Performance and results orientation', 4),
    ('problem_solving', 'trait', 'Problem-solving and analytical abilities', 5),
    ('thinking', 'trait', 'Thinking patterns and cognitive approaches', 6),
    ('creativity', 'trait', 'Creative and innovative capabilities', 7),
    ('communication', 'trait', 'Communication and interpersonal skills', 8),
    ('emotional_intelligence', 'trait', 'Emotional awareness and empathy', 9),
    ('service', 'trait', 'Service orientation and customer focus', 10),
    ('growth', 'trait', 'Learning and development mindset', 11),
    ('quality_focus', 'trait', 'Quality focus and attention to detail', 12),
    ('efficiency', 'trait', 'Time management and organizational skills', 13);

-- Insert departments
INSERT INTO public.departments (name) VALUES
    ('Engineering'),
    ('Product'),
    ('Sales'),
    ('Marketing'),
    ('Customer Success'),
    ('Finance'),
    ('Human Resources'),
    ('Operations'),
    ('Legal'),
    ('IT'),
    ('Design');

-- Insert job titles (global - no company_id)
INSERT INTO public.job_titles (name) VALUES
    ('Software Engineer'),
    ('Frontend Developer'),
    ('Backend Developer'),
    ('Full Stack Developer'),
    ('Product Manager'),
    ('Sales Manager'),
    ('Account Executive'),
    ('Customer Success Manager'),
    ('Marketing Specialist'),
    ('Data Scientist'),
    ('DevOps Engineer'),
    ('QA Engineer'),
    ('UI/UX Designer'),
    ('HR Manager'),
    ('Finance Analyst'),
    ('Operations Manager'),
    ('Legal Counsel'),
    ('IT Support Specialist'),
    ('Graphic Designer'),
    ('Content Writer'),
    ('Business Analyst'),
    ('Project Manager'),
    ('Recruiter'),
    ('Intern'),
    ('Chief Technology Officer'),
    ('Chief Product Officer'),
    ('Chief Executive Officer'),
    ('Chief Financial Officer'),
    ('Chief Operating Officer');

-- Insert employment types (global - no company_id)
INSERT INTO public.employment_types (name) VALUES
    ('Permanent'),
    ('Temporary'),
    ('Internship'),
    ('Apprenticeship'),
    ('Freelance'),
    ('Consultant'),
    ('Volunteer');

-- Insert initial skills data with category references
INSERT INTO public.skills (name, category_id, description) VALUES
    -- Technical Skills - Programming Languages
    ('JavaScript', (SELECT id FROM public.categories WHERE name = 'programming' AND type = 'skill'), 'Popular programming language for web development'),
    ('TypeScript', (SELECT id FROM public.categories WHERE name = 'programming' AND type = 'skill'), 'Typed superset of JavaScript'),
    ('Python', (SELECT id FROM public.categories WHERE name = 'programming' AND type = 'skill'), 'Versatile programming language for web, data science, and AI'),
    ('Java', (SELECT id FROM public.categories WHERE name = 'programming' AND type = 'skill'), 'Object-oriented programming language'),
    ('C++', (SELECT id FROM public.categories WHERE name = 'programming' AND type = 'skill'), 'System programming language'),
    ('Go', (SELECT id FROM public.categories WHERE name = 'programming' AND type = 'skill'), 'Modern programming language by Google'),
    ('Rust', (SELECT id FROM public.categories WHERE name = 'programming' AND type = 'skill'), 'Systems programming language focused on safety'),
    ('PHP', (SELECT id FROM public.categories WHERE name = 'programming' AND type = 'skill'), 'Server-side scripting language'),
    ('Ruby', (SELECT id FROM public.categories WHERE name = 'programming' AND type = 'skill'), 'Dynamic programming language'),
    ('Swift', (SELECT id FROM public.categories WHERE name = 'programming' AND type = 'skill'), 'Programming language for iOS development'),
    ('Kotlin', (SELECT id FROM public.categories WHERE name = 'programming' AND type = 'skill'), 'Programming language for Android development'),
    
    -- Technical Skills - Frameworks & Libraries
    ('React', (SELECT id FROM public.categories WHERE name = 'frontend' AND type = 'skill'), 'JavaScript library for building user interfaces'),
    ('Vue.js', (SELECT id FROM public.categories WHERE name = 'frontend' AND type = 'skill'), 'Progressive JavaScript framework'),
    ('Angular', (SELECT id FROM public.categories WHERE name = 'frontend' AND type = 'skill'), 'Platform for building mobile and desktop web applications'),
    ('Node.js', (SELECT id FROM public.categories WHERE name = 'backend' AND type = 'skill'), 'JavaScript runtime for server-side development'),
    ('Express.js', (SELECT id FROM public.categories WHERE name = 'backend' AND type = 'skill'), 'Web framework for Node.js'),
    ('Django', (SELECT id FROM public.categories WHERE name = 'backend' AND type = 'skill'), 'High-level Python web framework'),
    ('Laravel', (SELECT id FROM public.categories WHERE name = 'backend' AND type = 'skill'), 'PHP web application framework'),
    ('Spring Boot', (SELECT id FROM public.categories WHERE name = 'backend' AND type = 'skill'), 'Java-based framework'),
    
    -- Technical Skills - Databases
    ('SQL', (SELECT id FROM public.categories WHERE name = 'database' AND type = 'skill'), 'Structured Query Language for database management'),
    ('MongoDB', (SELECT id FROM public.categories WHERE name = 'database' AND type = 'skill'), 'NoSQL document database'),
    ('PostgreSQL', (SELECT id FROM public.categories WHERE name = 'database' AND type = 'skill'), 'Advanced open-source relational database'),
    ('MySQL', (SELECT id FROM public.categories WHERE name = 'database' AND type = 'skill'), 'Popular open-source relational database'),
    ('Redis', (SELECT id FROM public.categories WHERE name = 'database' AND type = 'skill'), 'In-memory data structure store'),
    
    -- Technical Skills - DevOps & Cloud
    ('AWS', (SELECT id FROM public.categories WHERE name = 'cloud' AND type = 'skill'), 'Amazon Web Services cloud platform'),
    ('Docker', (SELECT id FROM public.categories WHERE name = 'devops' AND type = 'skill'), 'Containerization platform'),
    ('Kubernetes', (SELECT id FROM public.categories WHERE name = 'devops' AND type = 'skill'), 'Container orchestration system'),
    ('CI/CD', (SELECT id FROM public.categories WHERE name = 'devops' AND type = 'skill'), 'Continuous Integration and Continuous Deployment'),
    ('Git', (SELECT id FROM public.categories WHERE name = 'tools' AND type = 'skill'), 'Version control system'),
    ('DevOps', (SELECT id FROM public.categories WHERE name = 'devops' AND type = 'skill'), 'Development and Operations practices'),
    
    -- Technical Skills - Other
    ('API Design', (SELECT id FROM public.categories WHERE name = 'backend' AND type = 'skill'), 'Designing and implementing APIs'),
    ('GraphQL', (SELECT id FROM public.categories WHERE name = 'backend' AND type = 'skill'), 'Query language for APIs'),
    ('REST APIs', (SELECT id FROM public.categories WHERE name = 'backend' AND type = 'skill'), 'Representational State Transfer API design'),
    ('Microservices', (SELECT id FROM public.categories WHERE name = 'architecture' AND type = 'skill'), 'Architectural pattern for distributed systems'),
    ('Machine Learning', (SELECT id FROM public.categories WHERE name = 'ai' AND type = 'skill'), 'Artificial intelligence and data science'),
    ('Data Analysis', (SELECT id FROM public.categories WHERE name = 'data' AND type = 'skill'), 'Analyzing and interpreting data'),
    ('Testing', (SELECT id FROM public.categories WHERE name = 'quality_assurance' AND type = 'skill'), 'Software testing methodologies'),
    ('Code Review', (SELECT id FROM public.categories WHERE name = 'quality_assurance' AND type = 'skill'), 'Peer review of source code'),
    
    -- Design & UX
    ('UI/UX Design', (SELECT id FROM public.categories WHERE name = 'design' AND type = 'skill'), 'User interface and user experience design'),
    ('Mobile Development', (SELECT id FROM public.categories WHERE name = 'mobile' AND type = 'skill'), 'Developing mobile applications'),
    
    -- Soft Skills
    ('Project Management', (SELECT id FROM public.categories WHERE name = 'management' AND type = 'skill'), 'Planning and executing projects'),
    ('Team Leadership', (SELECT id FROM public.categories WHERE name = 'leadership_skills' AND type = 'skill'), 'Leading and managing teams'),
    ('Communication', (SELECT id FROM public.categories WHERE name = 'soft_skills' AND type = 'skill'), 'Effective verbal and written communication'),
    ('Problem Solving', (SELECT id FROM public.categories WHERE name = 'soft_skills' AND type = 'skill'), 'Analytical and critical thinking skills'),
    ('Agile/Scrum', (SELECT id FROM public.categories WHERE name = 'methodology' AND type = 'skill'), 'Agile software development methodology'),
    ('Mentoring', (SELECT id FROM public.categories WHERE name = 'leadership_skills' AND type = 'skill'), 'Guiding and developing team members');

-- Insert initial traits data with category references
INSERT INTO public.traits (name, category_id, description) VALUES
    -- Work Style Traits
    ('Self-motivated', (SELECT id FROM public.categories WHERE name = 'work_style' AND type = 'trait'), 'Ability to work independently with minimal supervision'),
    ('Team player', (SELECT id FROM public.categories WHERE name = 'collaboration' AND type = 'trait'), 'Works well with others and contributes to team success'),
    ('Detail-oriented', (SELECT id FROM public.categories WHERE name = 'work_style' AND type = 'trait'), 'Pays attention to details and maintains high quality standards'),
    ('Adaptable', (SELECT id FROM public.categories WHERE name = 'personality' AND type = 'trait'), 'Flexible and adjusts well to change'),
    ('Proactive', (SELECT id FROM public.categories WHERE name = 'work_style' AND type = 'trait'), 'Takes initiative and anticipates needs'),
    ('Organized', (SELECT id FROM public.categories WHERE name = 'work_style' AND type = 'trait'), 'Maintains structure and manages time effectively'),
    ('Reliable', (SELECT id FROM public.categories WHERE name = 'personality' AND type = 'trait'), 'Consistent and dependable in delivering results'),
    ('Results-driven', (SELECT id FROM public.categories WHERE name = 'performance' AND type = 'trait'), 'Focused on achieving goals and measurable outcomes'),
    
    -- Problem-Solving Traits
    ('Creative problem solver', (SELECT id FROM public.categories WHERE name = 'problem_solving' AND type = 'trait'), 'Thinks outside the box to find innovative solutions'),
    ('Analytical', (SELECT id FROM public.categories WHERE name = 'problem_solving' AND type = 'trait'), 'Uses data and logic to analyze situations'),
    ('Strategic thinker', (SELECT id FROM public.categories WHERE name = 'thinking' AND type = 'trait'), 'Considers long-term implications and big picture'),
    ('Innovative', (SELECT id FROM public.categories WHERE name = 'creativity' AND type = 'trait'), 'Brings new ideas and approaches to challenges'),
    
    -- Communication Traits
    ('Strong communicator', (SELECT id FROM public.categories WHERE name = 'communication' AND type = 'trait'), 'Excellent verbal and written communication skills'),
    ('Collaborative', (SELECT id FROM public.categories WHERE name = 'collaboration' AND type = 'trait'), 'Works effectively with diverse teams and stakeholders'),
    ('Empathetic', (SELECT id FROM public.categories WHERE name = 'emotional_intelligence' AND type = 'trait'), 'Understanding and relating to others feelings'),
    ('Customer-focused', (SELECT id FROM public.categories WHERE name = 'service' AND type = 'trait'), 'Prioritizes customer needs and satisfaction'),
    
    -- Leadership Traits
    ('Leadership potential', (SELECT id FROM public.categories WHERE name = 'performance' AND type = 'trait'), 'Shows ability to guide and inspire others'),
    ('Mentor', (SELECT id FROM public.categories WHERE name = 'collaboration' AND type = 'trait'), 'Enjoys developing and guiding others'),
    ('Entrepreneurial', (SELECT id FROM public.categories WHERE name = 'creativity' AND type = 'trait'), 'Shows business acumen and initiative'),
    
    -- Learning & Growth
    ('Continuous learner', (SELECT id FROM public.categories WHERE name = 'growth' AND type = 'trait'), 'Committed to ongoing skill development'),
    ('Quality-focused', (SELECT id FROM public.categories WHERE name = 'quality_focus' AND type = 'trait'), 'Maintains high standards and attention to quality'),
    ('Risk-taker', (SELECT id FROM public.categories WHERE name = 'personality' AND type = 'trait'), 'Comfortable with calculated risks and uncertainty'),
    
    -- Time & Conflict Management
    ('Time management', (SELECT id FROM public.categories WHERE name = 'efficiency' AND type = 'trait'), 'Effectively manages time and priorities'),
    ('Conflict resolution', (SELECT id FROM public.categories WHERE name = 'communication' AND type = 'trait'), 'Skilled at resolving disagreements constructively');

-- ============================================================================
-- PART 10: Create indexes for better performance
-- ============================================================================

-- Categories indexes
CREATE INDEX idx_categories_type ON public.categories(type);
CREATE INDEX idx_categories_active ON public.categories(is_active) WHERE is_active = true;
CREATE INDEX idx_categories_sort_order ON public.categories(sort_order);

-- Skills indexes
CREATE INDEX idx_skills_category_id ON public.skills(category_id);
CREATE INDEX idx_skills_active ON public.skills(is_active) WHERE is_active = true;
CREATE INDEX idx_skills_name ON public.skills(name);
CREATE INDEX idx_skills_company_id ON public.skills(company_id);

-- Traits indexes
CREATE INDEX idx_traits_category_id ON public.traits(category_id);
CREATE INDEX idx_traits_active ON public.traits(is_active) WHERE is_active = true;
CREATE INDEX idx_traits_name ON public.traits(name);
CREATE INDEX idx_traits_company_id ON public.traits(company_id);

-- Job templates indexes
CREATE INDEX idx_job_templates_user ON public.job_templates(user_id);
CREATE INDEX idx_job_templates_active ON public.job_templates(is_active) WHERE is_active = true;
CREATE INDEX idx_job_templates_name ON public.job_templates(name);

-- Job titles indexes
CREATE INDEX idx_job_titles_company_id ON public.job_titles(company_id);
CREATE INDEX idx_job_titles_global ON public.job_titles(name) WHERE company_id IS NULL;

-- Employment types indexes
CREATE INDEX idx_employment_types_company_id ON public.employment_types(company_id);

-- ============================================================================
-- PART 11: Add updated_at triggers
-- ============================================================================

CREATE TRIGGER update_categories_updated_at 
    BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_skills_updated_at 
    BEFORE UPDATE ON public.skills
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_traits_updated_at 
    BEFORE UPDATE ON public.traits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_templates_updated_at 
    BEFORE UPDATE ON public.job_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_titles_updated_at 
    BEFORE UPDATE ON public.job_titles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at 
    BEFORE UPDATE ON public.departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employment_types_updated_at 
    BEFORE UPDATE ON public.employment_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PART 12: Create views
-- ============================================================================

-- Create skills_view
CREATE VIEW public.skills_view AS
SELECT 
    s.id,
    s.name,
    s.description,
    s.is_active,
    s.created_at,
    s.updated_at,
    s.company_id,
    c.name as category,
    c.description as category_description,
    c.sort_order as category_sort_order
FROM public.skills s
LEFT JOIN public.categories c ON s.category_id = c.id
WHERE s.is_active = true AND (c.is_active = true OR c.is_active IS NULL)
ORDER BY c.sort_order ASC, s.name ASC;

-- Create traits_view
CREATE VIEW public.traits_view AS
SELECT 
    t.id,
    t.name,
    t.description,
    t.is_active,
    t.created_at,
    t.updated_at,
    t.company_id,
    c.name as category,
    c.description as category_description,
    c.sort_order as category_sort_order
FROM public.traits t
LEFT JOIN public.categories c ON t.category_id = c.id
WHERE t.is_active = true AND (c.is_active = true OR c.is_active IS NULL)
ORDER BY c.sort_order ASC, t.name ASC;

-- Create job_templates_view
CREATE VIEW public.job_templates_view AS
SELECT 
    jt.id,
    jt.profile_id,
    jt.user_id,
    jt.name,
    jt.title,
    jt.description,
    jt.requirements,
    jt.template_data,
    jt.fields,
    jt.interview_format,
    jt.is_public,
    jt.is_active,
    jt.usage_count,
    jt.created_at,
    jt.updated_at,
    p.first_name,
    p.last_name,
    p.email,
    p.company_id
FROM public.job_templates jt
LEFT JOIN public.profiles p ON jt.profile_id = p.id
WHERE jt.is_public = true OR jt.profile_id = auth.uid();

-- Set security invoker for views
ALTER VIEW public.skills_view SET (security_invoker = on);
ALTER VIEW public.traits_view SET (security_invoker = on);
ALTER VIEW public.job_templates_view SET (security_invoker = on);

-- ============================================================================
-- PART 13: Enable RLS and create policies
-- ============================================================================

-- Enable RLS for all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employment_types ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categories (read-only for all authenticated users)
CREATE POLICY "Categories are viewable by authenticated users" ON public.categories
    FOR SELECT USING (auth.role() = 'authenticated' AND is_active = true);

-- RLS Policies for skills (read-only for all authenticated users)
CREATE POLICY "Skills are viewable by authenticated users" ON public.skills
    FOR SELECT USING (auth.role() = 'authenticated' AND is_active = true);

-- RLS Policies for traits (read-only for all authenticated users)
CREATE POLICY "Traits are viewable by authenticated users" ON public.traits
    FOR SELECT USING (auth.role() = 'authenticated' AND is_active = true);

-- RLS Policies for job templates (users can manage their own templates)
CREATE POLICY "Users can view their own job templates" ON public.job_templates
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own job templates" ON public.job_templates
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own job templates" ON public.job_templates
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own job templates" ON public.job_templates
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for job_titles
CREATE POLICY "Users can view job titles" ON public.job_titles
    FOR SELECT USING (
        company_id IS NULL OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND company_id = job_titles.company_id
        )
    );

CREATE POLICY "Users can create job titles for their company" ON public.job_titles
    FOR INSERT WITH CHECK (
        company_id IS NULL OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND company_id = job_titles.company_id
        )
    );

CREATE POLICY "Users can update their company job titles" ON public.job_titles
    FOR UPDATE USING (
        company_id IS NULL OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND company_id = job_titles.company_id
        )
    );

CREATE POLICY "Users can delete their company job titles" ON public.job_titles
    FOR DELETE USING (
        company_id IS NULL OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND company_id = job_titles.company_id
        )
    );

-- RLS Policies for departments (read-only for all authenticated users)
CREATE POLICY "Departments are viewable by authenticated users" ON public.departments
    FOR SELECT USING (auth.role() = 'authenticated');

-- RLS Policies for employment_types
CREATE POLICY "Users can view employment types" ON public.employment_types
    FOR SELECT USING (
        company_id IS NULL OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND company_id = employment_types.company_id
        )
    );

-- ============================================================================
-- PART 14: Grant permissions
-- ============================================================================

GRANT SELECT ON public.categories TO authenticated;
GRANT SELECT ON public.skills TO authenticated;
GRANT SELECT ON public.traits TO authenticated;
GRANT SELECT ON public.skills_view TO authenticated;
GRANT SELECT ON public.traits_view TO authenticated;
GRANT ALL ON public.job_templates TO authenticated;
GRANT SELECT ON public.job_titles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.job_titles TO authenticated;
GRANT SELECT ON public.departments TO authenticated;
GRANT SELECT ON public.employment_types TO authenticated;
GRANT SELECT ON public.job_templates_view TO authenticated;

-- ============================================================================
-- PART 15: Add comments for documentation
-- ============================================================================

COMMENT ON TABLE public.categories IS 'Categories for organizing skills and traits';
COMMENT ON TABLE public.skills IS 'Predefined skills that can be used in job postings';
COMMENT ON TABLE public.traits IS 'Predefined personality traits that can be used in job postings';
COMMENT ON TABLE public.job_templates IS 'User-saved job configurations for reuse';
COMMENT ON TABLE public.job_titles IS 'Common job titles for job postings';
COMMENT ON TABLE public.departments IS 'Departments within a company (e.g., Engineering, Sales, Product, etc.)';
COMMENT ON TABLE public.employment_types IS 'Types of employment contracts';
COMMENT ON VIEW public.skills_view IS 'View combining skills with their category information';
COMMENT ON VIEW public.traits_view IS 'View combining traits with their category information';
COMMENT ON VIEW public.job_templates_view IS 'View of job templates with user information for API compatibility';
COMMENT ON COLUMN public.categories.type IS 'Type of category: skill or trait';
COMMENT ON COLUMN public.skills.category_id IS 'Reference to the category this skill belongs to';
COMMENT ON COLUMN public.traits.category_id IS 'Reference to the category this trait belongs to';
COMMENT ON COLUMN public.job_templates.fields IS 'JSONB containing job configuration: skills, traits, experience_level, job_description, custom_fields';
COMMENT ON COLUMN public.job_titles.company_id IS 'Company ID for company-specific job titles. NULL for global templates.';
COMMENT ON COLUMN public.employment_types.company_id IS 'Company ID for company-specific employment types. NULL for global templates.'; 