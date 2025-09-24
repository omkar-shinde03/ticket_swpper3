// Send Combined Verification Edge Function (Deno/TypeScript)
// Purpose: Sends both email and phone verification in one step.

Deno.serve(async (req) => {
  // Parse request body
  const { email, phone } = await req.json();

  // TODO: Send email and phone verification

  return new Response(
    JSON.stringify({ message: 'Combined verification sent (template)' }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
