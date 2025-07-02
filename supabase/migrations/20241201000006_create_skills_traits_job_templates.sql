-- Create skills, traits, and job templates tables
-- This migration adds the tables needed for enhanced job creation functionality

-- Create categories table first
CREATE TABLE public.categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('skill', 'trait')),
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- Create skills table for managing common skills
CREATE TABLE public.skills (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create traits table for managing common traits
CREATE TABLE public.traits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create job templates table for saving job configurations
CREATE TABLE public.job_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(200) NOT NULL,
  title VARCHAR(300),
  fields JSONB,
  interview_format VARCHAR(20) DEFAULT 'text',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_template_name_per_user UNIQUE (user_id, name)
);

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

-- Create indexes for better performance
CREATE INDEX idx_categories_type ON public.categories(type);
CREATE INDEX idx_categories_active ON public.categories(is_active) WHERE is_active = true;
CREATE INDEX idx_categories_sort_order ON public.categories(sort_order);
CREATE INDEX idx_skills_category_id ON public.skills(category_id);
CREATE INDEX idx_skills_active ON public.skills(is_active) WHERE is_active = true;
CREATE INDEX idx_skills_name ON public.skills(name);
CREATE INDEX idx_traits_category_id ON public.traits(category_id);
CREATE INDEX idx_traits_active ON public.traits(is_active) WHERE is_active = true;
CREATE INDEX idx_traits_name ON public.traits(name);
CREATE INDEX idx_job_templates_user ON public.job_templates(user_id);
CREATE INDEX idx_job_templates_active ON public.job_templates(is_active) WHERE is_active = true;
CREATE INDEX idx_job_templates_name ON public.job_templates(name);

-- Add updated_at triggers
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

-- Create Views for Skills and Traits
CREATE OR REPLACE VIEW public.skills_view AS
SELECT 
    s.id,
    s.name,
    s.description,
    s.is_active,
    s.created_at,
    s.updated_at,
    c.name as category,
    c.description as category_description,
    c.sort_order as category_sort_order
FROM public.skills s
LEFT JOIN public.categories c ON s.category_id = c.id
WHERE s.is_active = true AND (c.is_active = true OR c.is_active IS NULL)
ORDER BY c.sort_order ASC, s.name ASC;

CREATE OR REPLACE VIEW public.traits_view AS
SELECT 
    t.id,
    t.name,
    t.description,
    t.is_active,
    t.created_at,
    t.updated_at,
    c.name as category,
    c.description as category_description,
    c.sort_order as category_sort_order
FROM public.traits t
LEFT JOIN public.categories c ON t.category_id = c.id
WHERE t.is_active = true AND (c.is_active = true OR c.is_active IS NULL)
ORDER BY c.sort_order ASC, t.name ASC;

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_templates ENABLE ROW LEVEL SECURITY;

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

-- Grant necessary permissions
GRANT SELECT ON public.categories TO authenticated;
GRANT SELECT ON public.skills TO authenticated;
GRANT SELECT ON public.traits TO authenticated;
GRANT SELECT ON public.skills_view TO authenticated;
GRANT SELECT ON public.traits_view TO authenticated;
GRANT ALL ON public.job_templates TO authenticated;

-- Comments for documentation
COMMENT ON TABLE public.categories IS 'Categories for organizing skills and traits';
COMMENT ON TABLE public.skills IS 'Predefined skills that can be used in job postings';
COMMENT ON TABLE public.traits IS 'Predefined personality traits that can be used in job postings';
COMMENT ON TABLE public.job_templates IS 'User-saved job configurations for reuse';
COMMENT ON VIEW public.skills_view IS 'View combining skills with their category information';
COMMENT ON VIEW public.traits_view IS 'View combining traits with their category information';
COMMENT ON COLUMN public.categories.type IS 'Type of category: skill or trait';
COMMENT ON COLUMN public.skills.category_id IS 'Reference to the category this skill belongs to';
COMMENT ON COLUMN public.traits.category_id IS 'Reference to the category this trait belongs to';
COMMENT ON COLUMN public.job_templates.fields IS 'JSONB containing job configuration: skills, traits, experience_level, job_description, custom_fields'; 