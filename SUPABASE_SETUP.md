# PayGuard AI - Supabase Project Setup Guide

Follow these steps to set up the backend infrastructure for PayGuard AI.

## 1. Create a New Project
1. Go to [Supabase Dashboard](https://app.supabase.com/).
2. Click **New Project** and name it **PayGuard AI**.
3. Note your project URL and API keys.

## 2. Initialize the Database
1. Open the **SQL Editor** in Supabase.
2. Paste the contents of `backend/database/production_schema.sql` into a new query.
3. Click **Run**.
4. This sets up the following core tables:
   - `profiles`: Unified user profiles (Company Admins & Workers).
   - `companies`: Individual Government Departments.
   - `workers`: Registered worker data linked to profiles.
   - `payroll_batches`: Master batch tracking for uploads.
   - `payroll_workers`: The worker records extracted from Excel files.
   - `worker_uploads`: Metadata for Bank Statements and App Screenshots.
   - `transfers`: Immutable record of Squad payouts.
   - `audit_logs`: Tracking for all high-risk actions.

## 3. Configure Storage Buckets
PayGuard requires three storage buckets to handle payroll files and identity proof.
1. Go to **Storage** in the Supabase sidebar.
2. Create the following buckets with **Public** access (for the hackathon demo):
   - `payroll_excels`
   - `statements`
   - `screenshots`

## 4. Authentication Integration
The schema includes a Postgres trigger `on_auth_user_created` that automatically synchronizes Supabase Auth users into our `public.profiles` table. Ensure this trigger is active after running the SQL script.

## 5. Environment Configuration
Update your `backend/.env` with the project details:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```
*(The Service Role key is required to bypass RLS for administrative payroll processing)*
