// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.
// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

console.log("Hello from Functions!")

Deno.serve(async (req) => {
  try {
    console.log(`Request method: ${req.method}`);
    
    // Handle both GET and POST requests
    if (req.method === 'GET') {
      console.log("Processing GET request");
      
      const data = {
        success: true,
        message: "API via Supabase Edge Function funcionando!",
        timestamp: new Date().toISOString(),
        method: "GET"
      };
      
      console.log("Returning GET response:", data);
      
      return new Response(JSON.stringify(data), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
    
    if (req.method === 'POST') {
      console.log("Processing POST request");
      
      const body = await req.json();
      const { name } = body;
      
      const data = {
        success: true,
        message: `Hello ${name || 'Functions'}!`,
        timestamp: new Date().toISOString(),
        method: "POST"
      };
      
      console.log("Returning POST response:", data);
      
      return new Response(JSON.stringify(data), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
    
    // Default response for other methods
    return new Response(JSON.stringify({
      success: false,
      message: "Method not allowed",
      allowedMethods: ["GET", "POST"]
    }), {
      status: 405,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
    
  } catch (error) {
    console.error("Error in cache-stats function:", error);
    
    return new Response(JSON.stringify({
      success: false,
      message: "Internal server error",
      error: error.message
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request GET 'http://127.0.0.1:54321/functions/v1/cache-stats' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/cache-stats' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/