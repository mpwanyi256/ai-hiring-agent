-- Update company slug generation to use camelCase format
-- This migration modifies the generate_company_slug function to generate slugs like 'companyName' instead of 'company-name'

CREATE OR REPLACE FUNCTION generate_company_slug(company_name TEXT)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
    words TEXT[];
    word TEXT;
    camel_case_slug TEXT := '';
    i INTEGER;
BEGIN
    -- Convert to lowercase and replace special chars with spaces
    base_slug := lower(regexp_replace(company_name, '[^a-zA-Z0-9\s]', ' ', 'g'));
    base_slug := regexp_replace(base_slug, '\s+', ' ', 'g');
    base_slug := trim(both ' ' from base_slug);
    
    -- Ensure slug is not empty
    IF base_slug = '' THEN
        base_slug := 'company';
    END IF;
    
    -- Split into words
    words := string_to_array(base_slug, ' ');
    
    -- Convert to camelCase
    FOR i IN 1..array_length(words, 1) LOOP
        word := words[i];
        IF i = 1 THEN
            -- First word stays lowercase
            camel_case_slug := word;
        ELSE
            -- Subsequent words are capitalized
            camel_case_slug := camel_case_slug || initcap(word);
        END IF;
    END LOOP;
    
    final_slug := camel_case_slug;
    
    -- Check for uniqueness and append number if needed
    WHILE EXISTS (SELECT 1 FROM public.companies WHERE slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := camel_case_slug || counter::TEXT;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql; 