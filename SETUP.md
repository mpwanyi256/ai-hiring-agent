# AI Hiring Agent - Setup Guide

## Database Setup & Migration

### Issues Fixed in Latest Migrations

**Migration 20241201000005 (Latest) - User Role Type Fix & Simplification**
1. **User Role Type Error**: Fixed "type user_role does not exist" error by properly creating enum type
2. **Function Simplification**: Removed redundant role assignment in `handle_new_user()` function 
3. **Cleaner Code**: Role now defaults to 'recruiter' automatically via column default
4. **Proper Type Permissions**: Added comprehensive grants for user_role enum type

**Previous Migrations**
1. **Authentication Function Errors**: Fixed `generate_company_slug` function not existing
2. **RLS Policy Issues**: Updated Row Level Security policies to allow trigger operations
3. **Permission Issues**: Added proper grants and SECURITY DEFINER functions
4. **User Data Access**: Created comprehensive `user_details` view for easier queries

### Migration Files (Run in Order)

1. `20241201000001_initial_setup.sql` - Initial database schema
2. `20241201000002_fix_auth_and_create_user_view.sql` - Auth fixes and user view
3. `20241201000003_add_roles_and_fix_rls.sql` - Added user roles and RLS policies
4. `20241201000004_ensure_user_role_type.sql` - User role type creation attempt
5. `20241201000005_fix_user_role_and_simplify.sql` - **Final fix for user_role type and simplified function**

### Setup Instructions

#### 1. Create Supabase Project
1. Go to [Supabase](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key

#### 2. Environment Variables
Create `.env.local` in the project root:
```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### 3. Run Migrations

**Option A: Using Supabase CLI (Recommended)**
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your_project_ref

# Run migrations
supabase db push
```

**Option B: Manual SQL Execution**
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/migrations/20241201000001_initial_setup.sql`
4. Run the query
5. Copy and paste the contents of `supabase/migrations/20241201000002_fix_auth_and_create_user_view.sql`
6. Run the query

#### 4. Verify Setup
After running migrations, verify in Supabase:

1. **Tables Created**: 
   - companies, profiles, subscriptions, user_subscriptions
   - jobs, candidates, responses, evaluations

2. **View Created**: 
   - user_details (combines user, company, and subscription data)

3. **Functions Created**:
   - generate_company_slug()
   - handle_new_user()

4. **Triggers Created**:
   - on_auth_user_created (automatically creates profile and company on signup)

#### 5. Test Signup Flow
1. Start the development server: `npm run dev`
2. Go to `/signup`
3. Complete the signup process
4. Check Supabase dashboard to verify:
   - User created in auth.users
   - Profile created in profiles table
   - Company created in companies table
   - Free subscription assigned in user_subscriptions

### Key Features of New Setup

#### User Details View
The `user_details` view provides a single query interface for:
- User profile information
- Company details
- Active subscription information
- Usage counts (active jobs, interviews this month)

```sql
SELECT * FROM user_details WHERE id = 'user_id';
```

#### Authentication Flow
1. User signs up with company name, personal info, email, password
2. Trigger automatically:
   - Checks if company exists (case-insensitive)
   - Creates company if it doesn't exist
   - Creates user profile linked to company
   - Assigns free tier subscription
3. User confirms email and can sign in
4. Dashboard loads with full user, company, and subscription data

#### Security Features
- Row Level Security (RLS) enabled on all tables
- Service role has full access for triggers
- Anonymous users can access interview flow
- Authenticated users can only access their own data

### Troubleshooting

#### Common Issues

1. **Function doesn't exist error**
   - Ensure the second migration ran successfully
   - Check that functions have proper SECURITY DEFINER

2. **Permission denied errors**
   - Verify RLS policies are created
   - Check grants to authenticated and service_role

3. **Signup fails silently**
   - Check Supabase logs in dashboard
   - Verify trigger is created and enabled

4. **User data not loading**
   - Ensure user_details view exists
   - Check that user has active subscription

#### Checking Migration Status
```sql
-- Check if functions exist
SELECT proname FROM pg_proc WHERE proname IN ('generate_company_slug', 'handle_new_user');

-- Check if trigger exists
SELECT tgname FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Check if view exists
SELECT viewname FROM pg_views WHERE viewname = 'user_details';

-- Check subscription tiers
SELECT * FROM subscriptions;
```

### Next Steps After Setup

1. Test complete signup and signin flow
2. Build employer dashboard
3. Implement job creation functionality
4. Add AI interview system
5. Set up billing with Stripe (for paid tiers)

### Environment Configuration

Make sure your environment variables are properly set:

```env
# Required for Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Required for interview links
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: For AI features later
OPENAI_API_KEY=
``` 