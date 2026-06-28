import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Get the user making the request to verify they are authenticated
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized request");
    }

    // Verify the user is an admin (Optional: check role in database if strictly enforced)
    const { data: userData } = await supabaseClient
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userData?.role !== "admin") {
      throw new Error("Forbidden: Only admins can create users");
    }

    // Parse request body
    const { email, password, divisi_id, role, nama_lengkap } = await req.json();

    if (!email || !password || !divisi_id || !role) {
      throw new Error("Missing required fields");
    }

    // Create a Supabase admin client to bypass RLS and create auth user
    // This requires the SERVICE_ROLE_KEY to be set in the environment
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Create user in auth.users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) throw authError;

    const newUserId = authData.user.id;

    // Create user record in public.users
    const { error: dbError } = await supabaseAdmin
      .from("users")
      .insert([
        {
          id: newUserId,
          role: role,
          divisi_id: divisi_id,
          nama_lengkap: nama_lengkap || email,
        },
      ]);

    if (dbError) {
      // Rollback (delete auth user if DB insert fails)
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      throw dbError;
    }

    return new Response(JSON.stringify({ success: true, user: authData.user }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
