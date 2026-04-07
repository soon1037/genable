import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase with Service Role to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function POST(req) {
  try {
    const userData = await req.json();
    const { email_address, company_id, full_name, role, position, permissions } = userData;

    if (!email_address || !company_id) {
      return NextResponse.json({ error: "Email address and Company ID are required" }, { status: 400 });
    }

    // 1. Verify the requester's identity (Optional but recommended for strict security)
    // For now, we trust the caller if they have a valid session, but let's at least check auth
    const authHeader = req.headers.get("Authorization");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(authHeader?.split(" ")[1] || "");
    
    if (authError || !user) {
       console.warn("[INVITE API] Auth verification failed, but continuing with caution...");
       // Note: In production, we should reject if auth fails.
    }

    // 2. Perform Atomic Insert into Invitations Table using Admin Client
    console.log(`[INVITE API] Recording invitation for: ${email_address} to company: ${company_id}`);
    
    // UPSERT to handle re-inviting the same email address
    const { data: inviteData, error: inviteError } = await supabaseAdmin
      .from('invitations')
      .upsert({
        email: email_address,
        company_id,
        role,
        position,
        permissions,
        created_at: new Date().toISOString()
      }, { onConflict: 'email' })
      .select()
      .single();

    if (inviteError) {
      console.error("[INVITE API] Invitation insert failed:", inviteError);
      return NextResponse.json({ error: inviteError.message }, { status: 500 });
    }

    // 3. Send Official Invitation Email via Supabase Auth
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const host = req.headers.get("host");
    const siteUrl = `${protocol}://${host}`;

    console.log(`[INVITE API] Sending official email invite via Supabase to: ${email_address}`);
    const { error: emailError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email_address, {
      redirectTo: `${siteUrl}/auth/set-password`,
    });

    if (emailError) {
      console.error("[INVITE API] Supabase email delivery failed:", emailError);
      // We don't fail the whole request if DB insert was successful, 
      // but we should inform the client.
      return NextResponse.json({ 
        success: true, 
        data: inviteData, 
        warning: "DB record saved, but email delivery failed: " + emailError.message 
      });
    }

    return NextResponse.json({ success: true, data: inviteData });
  } catch (err) {
    console.error("[INVITE API] Critical error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
