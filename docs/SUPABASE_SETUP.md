# Supabase Authentication Setup Guide

This guide walks through configuring Supabase authentication for the AI Email Template application.

## Prerequisites

- Supabase account ([sign up here](https://supabase.com))
- Supabase project created

## Step 1: Get Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to **Settings → API**
3. Copy the following values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **Anon/Public Key** (long string starting with `eyJ...`)

4. Add these to your `.env` file:
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Step 2: Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Navigate to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth client ID**
5. Application type: **Web application**
6. Add authorized redirect URI:
   ```
   https://[your-project-ref].supabase.co/auth/v1/callback
   ```
7. Copy the **Client ID** and **Client Secret**

8. In Supabase Dashboard:
   - Go to **Authentication → Providers**
   - Enable **Google**
   - Paste Client ID and Client Secret
   - Save

## Step 3: Configure GitHub OAuth

1. Go to **GitHub Settings → Developer settings → OAuth Apps**
2. Click **New OAuth App**
3. Fill in details:
   - Application name: Your app name
   - Homepage URL: Your app URL
   - Authorization callback URL:
     ```
     https://[your-project-ref].supabase.co/auth/v1/callback
     ```
4. Click **Register application**
5. Copy **Client ID**
6. Click **Generate a new client secret** and copy it

7. In Supabase Dashboard:
   - Go to **Authentication → Providers**
   - Enable **GitHub**
   - Paste Client ID and Client Secret
   - Save

## Step 4: Configure Email Settings

1. In Supabase Dashboard, go to **Authentication → Email**
2. **Enable email confirmations**: Set to **OFF** (optional verification)
3. Review and customize email templates if desired

## Step 5: Test Authentication

1. Start your development server: `bun run dev`
2. Try signing up with email/password
3. Try logging in with Google (if configured)
4. Try logging in with GitHub (if configured)

## Troubleshooting

### OAuth Popup Blocked
- Ensure popups are allowed for your localhost domain
- Check browser console for errors

### "Invalid redirect URL"
- Verify the redirect URL in OAuth provider settings exactly matches:
  `https://[your-project-ref].supabase.co/auth/v1/callback`

### Email not sending
- Check Supabase logs in Dashboard → Authentication → Logs
- Verify email provider is configured (Supabase uses built-in provider for development)

### Session not persisting
- Clear browser localStorage and cookies
- Check browser console for errors
- Verify environment variables are set correctly

## Security Notes

- Never commit `.env` file with real credentials
- Use environment variables for all sensitive data
- The `VITE_SUPABASE_ANON_KEY` is safe to expose in frontend (it's public)
- Never expose the **service role key** in frontend code
