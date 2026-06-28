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

    // Get the user making the request (Courier)
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized request");
    }

    // Parse the multipart form data
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const surat_id = formData.get("surat_id") as string;
    const hash = formData.get("hash") as string;
    const lat = formData.get("lat") as string;
    const lon = formData.get("lon") as string;

    if (!file || !surat_id || !hash) {
      throw new Error("Missing required fields: file, surat_id, or hash");
    }

    // Create a Supabase admin client to bypass RLS for storage if needed
    // or use the regular client if RLS policies are set up correctly.
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Upload the file to Supabase Storage bucket 'bukti_ekspedisi'
    const fileExt = file.name.split('.').pop();
    const fileName = `${surat_id}_${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("bukti-surat")
      .upload(filePath, file, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    // 2. Get the public URL for the uploaded file
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from("bukti-surat")
      .getPublicUrl(filePath);

    // 3. Update the surat_ekspedisi row in the database
    const { error: dbError } = await supabaseAdmin
      .from("surat_ekspedisi")
      .update({
        foto_bukti_url: publicUrl,
        foto_hash: hash,
        foto_latitude: lat ? parseFloat(lat) : null,
        foto_longitude: lon ? parseFloat(lon) : null,
        status: "diterima",
        is_synced: true,
        tanggal_penerimaan: new Date().toISOString(),
      })
      .eq("uuid", surat_id);

    if (dbError) {
      // Cleanup the uploaded file if DB update fails
      await supabaseAdmin.storage.from("bukti-surat").remove([filePath]);
      throw new Error(`Failed to update database: ${dbError.message}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Proof uploaded and synchronized successfully",
        url: publicUrl 
      }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
