# Supabase Database Setup for Kithai AI

To get the Kithai AI application running, you need to set up the necessary tables in your Supabase database. This guide provides the SQL script to create the tables based on the required schema, including policies for row-level security.

## Instructions

1.  **Navigate to your Supabase Project:** Open your Supabase project dashboard.
2.  **Go to the SQL Editor:** In the left-hand navigation menu, find and click on **SQL Editor**.
3.  **Create a New Query:** Click on the **+ New query** button.
4.  **Copy and Paste the SQL:** Copy the entire SQL script below and paste it into the query editor.
5.  **Run the Script:** Click the **Run** button.

This will create all the required tables and security policies for the application to function correctly.

---

## SQL Script

```sql
-- 1. Create user_settings table
-- This table stores settings specific to each user, identified by their email.
create table public.user_settings (
  user_email text not null primary key,
  persona_name text,
  roles_and_description text,
  voice text,
  whatsapp_phone_number text,
  is_whatsapp_connected boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- RLS Policy for user_settings
-- Ensures users can only access and modify their own settings.
alter table public.user_settings enable row level security;
create policy "Users can manage their own settings"
  on public.user_settings for all
  using ( auth.jwt() ->> 'email' = user_email )
  with check ( auth.jwt() ->> 'email' = user_email );

-- 2. Create conversation_history table
-- Stores individual turns from conversations for each user.
create table public.conversation_history (
  id bigint generated always as identity primary key,
  user_email text not null,
  turn_data jsonb,
  created_at timestamp with time zone default now()
);

-- RLS Policy for conversation_history
-- Ensures users can only manage their own conversation history.
alter table public.conversation_history enable row level security;
create policy "Users can manage their own conversation history"
  on public.conversation_history for all
  using ( auth.jwt() ->> 'email' = user_email )
  with check ( auth.jwt() ->> 'email' = user_email );

-- 3. Create memories table
-- Stores long-term memories or notes for a user.
create table public.memories (
  id bigint generated always as identity primary key,
  user_email text not null,
  memory_text text not null,
  created_at timestamp with time zone default now()
);

-- RLS Policy for memories
-- Ensures users can only manage their own memories.
alter table public.memories enable row level security;
create policy "Users can manage their own memories"
  on public.memories for all
  using ( auth.jwt() ->> 'email' = user_email )
  with check ( auth.jwt() ->> 'email' = user_email );

-- 4. Create settings table
-- A global table for application-wide settings.
-- Note: This table is intended for admin use. The policy below makes it read-only for all authenticated users.
-- You may want to adjust this for your own admin roles.
create table public.settings (
  id bigint primary key,
  systemPrompt text,
  model text,
  voice text,
  googleClientId text,
  googleClientSecret text,
  googleRedirectUri text,
  whatsappAccessToken text,
  whatsappPhoneNumberId text,
  whatsappBusinessAccountId text,
  geminiApiKey text,
  created_at timestamp with time zone default now()
);

-- RLS Policy for settings
-- Allows any authenticated user to read the global settings.
alter table public.settings enable row level security;
create policy "Authenticated users can read global settings"
  on public.settings for select
  using ( auth.role() = 'authenticated' );

-- Optional: Insert a default settings row if one doesn't exist.
-- The application does not write to this table, so it must be populated manually or with a script like this.
insert into public.settings (id, model, voice)
values (1, 'gemini-2.5-flash-native-audio-preview-09-2025', 'Zephyr')
on conflict (id) do nothing;

```
---

## Google Authentication Setup (Required for Sign in with Google)

To enable users to sign in with their Google accounts, you need to configure the Google Auth Provider in your Supabase project.

1.  **Navigate to Authentication Providers:**
    *   In your Supabase project dashboard, go to **Authentication** in the left sidebar.
    *   Select the **Providers** tab.

2.  **Enable the Google Provider:**
    *   Find **Google** in the list of providers and click on it to open the configuration panel.
    *   Toggle the **Enable Google** switch to turn it on.

3.  **Add Your Credentials:**
    *   You will see fields for `Client ID` and `Client Secret`. Copy and paste the credentials you obtained from the Google Cloud Console into these fields.
    *   **Client ID:** `73350400049-rkdom6vkoo3ou8km5sgb043e6foj9o9o.apps.googleusercontent.com`
    *   **Client Secret:** `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`

4.  **Configure Authorized Redirect URI:**
    *   In your Google Cloud Console's OAuth 2.0 Client ID settings, make sure you have added the following URL to the **Authorized redirect URIs**:
    *   `https://ockscvdpcdblgnfvociq.supabase.co/auth/v1/callback`

5.  **Add Required Scopes for Function Calling:**
    *   To allow the application to access Google APIs (like Calendar and Gmail) for function calling in the future, you need to request specific permissions (scopes) from the user during sign-in.
    *   In the Supabase Google provider configuration, find the **Scopes** field.
    *   Add the following scopes, separated by a space:
        ```
        https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/gmail.send
        ```
    *   This will ensure that when a user signs in with Google, your application receives the necessary permissions to act on their behalf for creating calendar events and sending emails.

6.  **Save your configuration.**

After completing these steps, the "Sign in with Google" button in the application will work correctly.