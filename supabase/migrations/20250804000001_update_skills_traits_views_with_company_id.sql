-- Migration: Update skills and traits views to include company_id
-- This fixes the API errors when querying company-specific skills and traits

-- 1. Drop existing views
DROP VIEW IF EXISTS public.skills_view;
DROP VIEW IF EXISTS public.traits_view;

-- 2. Recreate skills_view with company_id
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
WHERE s.is_active = true
ORDER BY c.sort_order, s.name;

-- 3. Recreate traits_view with company_id  
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
WHERE t.is_active = true
ORDER BY c.sort_order, t.name;

-- 4. Add comments for documentation
COMMENT ON VIEW public.skills_view IS 'Enhanced view of skills with category information and company filtering support';
COMMENT ON VIEW public.traits_view IS 'Enhanced view of traits with category information and company filtering support'; 

-- Set row level policy
ALTER VIEW public.skills_view SET (security_invoker = on);
GRANT SELECT ON public.skills_view TO authenticated;

ALTER VIEW public.traits_view SET (security_invoker = on);
GRANT SELECT ON public.traits_view TO authenticated;

-- Set row level policy
ALTER VIEW public.interview_details SET (security_invoker = on);
GRANT SELECT ON public.interview_details TO authenticated;

-- Set row level policy
ALTER VIEW public.jobs_comprehensive SET (security_invoker = on);
GRANT SELECT ON public.jobs_comprehensive TO authenticated;

-- Set row level policy
ALTER VIEW public.jobs_view SET (security_invoker = on);
GRANT SELECT ON public.jobs_view TO authenticated;

-- Set row level policy
ALTER VIEW public.jobs_view SET (security_invoker = on);
GRANT SELECT ON public.jobs_view TO authenticated;