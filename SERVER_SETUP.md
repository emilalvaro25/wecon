# Supabase Server-Side Setup for Google API Function Calls

To securely execute function calls that interact with Google APIs (like Calendar, Gmail, Drive, and Sheets), you need a server-side component. A Supabase Edge Function is the perfect tool for this. It can securely store and use the user's API credentials without exposing them to the client-side application.

This guide provides the full code and deployment instructions for a single Edge Function that acts as a proxy to handle all Google API requests.

## Instructions

### 1. Install/Update the Supabase CLI

First, ensure you have the Supabase CLI installed and are logged in.

```bash
# Install/update the CLI
npm install supabase@latest -g

# Log in to your Supabase account
supabase login

# Link your local project to your Supabase project
supabase link --project-ref <YOUR-PROJECT-ID>
```

### 2. Create a New Edge Function

From the root of your local project, run the following command to create a new function. We'll name it `google-api-proxy`.

```bash
supabase functions new google-api-proxy
```

This will create a new folder at `supabase/functions/google-api-proxy/index.ts`.

### 3. Add the Function Code

Replace the entire content of the newly created `supabase/functions/google-api-proxy/index.ts` file with the code below. This code sets up a server, handles CORS, authenticates the user, retrieves their Google access token, and routes requests to the correct Google API based on the tool the AI wants to use.

```typescript
// supabase/functions/google-api-proxy/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers for preflight and actual requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Main function logic
async function handler(req: Request) {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // --- 1. Initialize Supabase Admin Client ---
    // The admin client is required to securely access user identity data
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // --- 2. Authenticate User ---
    // Get the user's session from the Authorization header
    const { data: { user }, error: userError } = await supabaseClient.auth
      .getUser(
        req.headers.get("Authorization")!.replace("Bearer ", ""),
      );

    if (userError) throw userError;
    if (!user) throw new Error("User not found");

    // --- 3. Retrieve Google Provider Token ---
    // This token is granted by the user during Google Sign-In
    const providerToken = user.user_metadata?.provider_token;
    if (!providerToken) {
      throw new Error("Google provider token not found for the user.");
    }
    
    // --- 4. Get Tool Details from Request ---
    const { toolName, toolArgs } = await req.json();
    if (!toolName || !toolArgs) {
      throw new Error("Missing toolName or toolArgs in the request body.");
    }

    let result: unknown;

    // --- 5. Route to the Correct Google API ---
    switch (toolName) {
      case "create_calendar_event":
        result = await createCalendarEvent(providerToken, toolArgs);
        break;
      case "send_email":
        result = await sendEmail(providerToken, toolArgs);
        break;
      case "create_google_doc":
        result = await createGoogleDoc(providerToken, toolArgs);
        break;
      case "create_google_sheet":
        result = await createGoogleSheet(providerToken, toolArgs);
        break;
      default:
        throw new Error(`Tool "${toolName}" is not supported.`);
    }

    // --- 6. Return Success Response ---
    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    // --- 7. Return Error Response ---
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
}

// --- API Helper Functions ---

// Creates an event on the user's primary Google Calendar
async function createCalendarEvent(token: string, args: any) {
  const response = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: args.summary,
        location: args.location,
        start: { dateTime: args.startTime, timeZone: "UTC" },
        end: { dateTime: args.endTime, timeZone: "UTC" },
      }),
    },
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data.error.message);
  return `Event created successfully! View it here: ${data.htmlLink}`;
}

// Sends an email from the user's Gmail account
async function sendEmail(token: string, args: any) {
  const emailMessage = [
    `To: ${args.recipient}`,
    `Subject: ${args.subject}`,
    "",
    args.body,
  ].join("\n");

  const response = await fetch(
    "https://www.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        raw: btoa(emailMessage).replace(/\+/g, "-").replace(/\//g, "_"),
      }),
    },
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data.error.message);
  return "Email sent successfully!";
}

// Creates a new Google Doc in the user's Drive
async function createGoogleDoc(token: string, args: any) {
  const response = await fetch("https://docs.googleapis.com/v1/documents", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: args.title,
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error.message);
  return `Google Doc created successfully! View it here: https://docs.google.com/document/d/${data.documentId}`;
}

// Creates a new Google Sheet in the user's Drive
async function createGoogleSheet(token: string, args: any) {
  const response = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      properties: {
        title: args.title,
      },
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error.message);
  return `Google Sheet created successfully! View it here: ${data.spreadsheetUrl}`;
}


// Start the Deno server
serve(handler);
```

### 4. Deploy the Function

Now, deploy your function to Supabase.

```bash
supabase functions deploy google-api-proxy
```

After deployment, your server-side logic is live and ready to be called by the application. The frontend has already been updated to call this specific function when the AI requests a tool to be used.
