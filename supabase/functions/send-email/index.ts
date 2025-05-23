import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { Resend } from "npm:resend";

// Setup Resend with secret API key
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// CORS headers
const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*", // Change to specific domain for production
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

serve(async (req) => {
  // Handle preflight CORS request
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  try {
    const { to, subject, html } = await req.json();

    if (!to || !subject || !html) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers
      });
    }

    const result = await resend.emails.send({
      from: Deno.env.get("RESEND_FROM"),
      to,
      subject,
      html
    });

    return new Response(JSON.stringify({ success: true, result }), {
      status: 200,
      headers
    });

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Unknown server error" }),
      {
        status: 500,
        headers
      }
    );
  }
});
