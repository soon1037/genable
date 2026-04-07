import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase with Service Role to bypass RLS for beacon requests
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function POST(req) {
  try {
    // navigator.sendBeacon sends data as text/plain or Blob, 
    // but Next.js can parse it if we use req.text() or req.json()
    const rawData = await req.text();
    let sessionId;
    
    try {
      const parsed = JSON.parse(rawData);
      sessionId = parsed.sessionId;
    } catch (e) {
      // Fallback for simple string payloads
      sessionId = rawData;
    }

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    console.log(`[SESSION TERMINATE] Beacon received for session: ${sessionId}`);

    // Update session status and end time
    const { error } = await supabaseAdmin
      .from('sessions')
      .update({ 
        status: 'completed',
        ended_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (error) {
      console.error("[SESSION TERMINATE] Database update failed:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[SESSION TERMINATE] Critical error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
