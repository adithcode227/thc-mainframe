# Supabase Integration & Database Administration Guide

This guide describes how to connect your Guest Registration Card (GRC) Next.js web application to your live Supabase project, execute the SQL schema, and manage staff credentials.

---

## Step 1: Create a Supabase Project
1. Go to [Supabase](https://supabase.com) and sign in.
2. Click **New Project** and select your organization.
3. Choose a project name (e.g. `thcstays-mainframe`), set a secure Database Password, and select the region closest to your resort (e.g., **Mumbai, India** or **Singapore**).
4. Wait a couple of minutes for Supabase to provision your database.

---

## Step 2: Configure Environment Variables
You need to create a file named `.env.local` in the root of your project directory (`c:\Users\ADITH\Desktop\thc mainframe\.env.local`) and paste the following configuration:

```env
# 1. Supabase Project API URL & Public Key
# Found in Supabase Dashboard -> Project Settings -> API
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 2. Supabase Service Role Key (Keep secret! Do not share or commit this key)
# Found in Supabase Dashboard -> Project Settings -> API (labelled as "service_role" or "secret")
# Required to generate secure document signed URLs for viewing guest IDs
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> [!IMPORTANT]
> Once these variables are saved in `.env.local`, restart your local server by pressing `Ctrl + C` in the terminal and running `npm run dev` again. The application will automatically exit Sandbox Mode and switch to live database connections.

---

## Step 3: Initialize Database Schema & RLS Policies
We have provided a complete database schema file in your workspace: [supabase_schema.sql](file:///c:/Users/ADITH/Desktop/thc%20mainframe/supabase_schema.sql).

1. In your Supabase Dashboard, click on the **SQL Editor** tab (terminal icon on the left sidebar).
2. Click **New Query** -> **Blank Query**.
3. Open [supabase_schema.sql](file:///c:/Users/ADITH/Desktop/thc%20mainframe/supabase_schema.sql) in your text editor, copy the entire contents, and paste it into the Supabase SQL editor.
4. Click **Run** at the bottom right.
5. You should see a success message: `Success. No rows returned.`

This automatically creates:
* `properties` table (Resorts listing)
* `staff_profiles` table (Staff permissions linking to Supabase auth accounts)
* `guest_register` table (DPDP-compliant visitor logs)
* Secure private Storage bucket (`guest-identities`) for encrypted Aadhaar/Passport uploads.
* Row-Level Security (RLS) policies protecting files from public access.

---

## Step 4: Create Resort Property Records
To list properties on your registration page (e.g. Pantai Retreat and Ocean Pals), you need to insert rows in the `properties` table:

1. In Supabase, go to the **Table Editor** (grid icon on the left sidebar).
2. Select the `properties` table.
3. Click **Insert row** and add your resorts:
   * **Row 1:** 
     * `name`: `Pantai Retreat Villa`
     * `location`: `Azhikode, Thrissur, Kerala`
   * **Row 2:** 
     * `name`: `Ocean Pals Two Villas`
     * `location`: `Azhikode, Thrissur, Kerala`
4. Copy the generated `id` (UUID) for each property—you will need these when creating staff profiles!

---

## Step 5: Register Staff & Create Access Logins
To log in as a receptionist or manager on the Dashboard, you need to create a login account in Supabase Authentication and link it to a staff profile role:

### Part A: Create the Login Credentials
1. In the Supabase left sidebar, click on **Authentication** (user lock icon).
2. Click **Users** -> **Add User** -> **Create User**.
3. Enter the staff email address (e.g., `manager@pantairesort.com`) and set a secure password.
4. **UNCHECK** the box "Send email confirmation" to enable instant login, then click **Save**.
5. Copy the generated **User ID** (UUID) for this user.

### Part B: Link the User to a Role & Property
1. Go back to the **Table Editor** and select the `staff_profiles` table.
2. Click **Insert row**.
3. Fill in the columns:
   * `id`: Paste the **User ID** (UUID) you copied from Part A.
   * `property_id`: Paste the **Property ID** (UUID) you copied from Step 4 (e.g. Pantai Retreat Villa's ID). If this user is an admin managing both properties, leave this column `NULL` (empty).
   * `role`: Type either `admin` (can view all properties) or `receptionist` (can only view and log guests for their assigned property).
4. Click **Save**.

---

## Step 6: Logging In to your Admin Panel
1. Start your local dev server (`npm run dev`) and visit `http://localhost:3000`.
2. Click **Access Manager Panel** in the navigation bar. You will be redirected to the login screen (`/login`).
3. Enter the email and password you created in Step 5.
4. You will be granted access to the live guest registry. If you logged in as a receptionist, you will only see guest registrations for your assigned villa!
