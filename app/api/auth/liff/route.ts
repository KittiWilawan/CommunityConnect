import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase-server";
import { ensureProfile } from "@/app/lib/ensure-profile";
import { normalizeRole } from "@/app/lib/roles";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { error: "idToken is required" },
        { status: 400 }
      );
    }

    const clientId = process.env.SUPABASE_AUTH_EXTERNAL_LINE_CLIENT_ID;
    const clientSecret = process.env.SUPABASE_AUTH_EXTERNAL_LINE_SECRET;

    if (!clientId || !clientSecret) {
      console.warn("Missing LINE credentials in environment");
      return NextResponse.json({ error: "Server configuration error (Missing LINE credentials)" }, { status: 500 });
    }

    // 1. Verify ID Token with LINE API
    // This is required for production security to ensure the token is valid and hasn't been tampered with.
    const params = new URLSearchParams();
    params.append('id_token', idToken);
    params.append('client_id', clientId);

    const verifyRes = await fetch('https://api.line.me/oauth2/v2.1/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    const payload = await verifyRes.json();

    if (!verifyRes.ok || payload.error) {
      console.error("LINE verify error:", payload);
      return NextResponse.json({ error: payload.error_description || "Invalid ID token" }, { status: 401 });
    }

    // 2. Generate deterministic but secure credentials for Supabase
    // Since Supabase Cloud doesn't support 'line' natively in signInWithIdToken without Custom OIDC (paid),
    // we use a secure deterministic email/password strategy.
    const lineId = payload.sub;
    const email = `${lineId}@line.liff.user`;
    
    // Hash the lineId with the server secret to create an unguessable password
    const password = crypto.createHash('sha256').update(lineId + clientSecret).digest('hex');

    const supabase = await createClient();

    // 3. Attempt Login
    let authRes: any = await supabase.auth.signInWithPassword({ email, password });

    // 4. If login fails (user doesn't exist), Sign Up
    if (authRes.error && authRes.error.message.includes("Invalid login credentials")) {
      authRes = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: payload.name,
            avatar_url: payload.picture,
            provider: "line"
          }
        }
      });
    }

    if (authRes.error) {
      console.error("Supabase Auth error:", authRes.error.message);
      return NextResponse.json({ error: authRes.error.message }, { status: 401 });
    }

    const { data } = authRes;

    if (!data?.user || !data?.session) {
      return NextResponse.json({ error: "No user or session returned" }, { status: 401 });
    }

    // 5. Ensure profile exists in our public.profiles table
    const profile = await ensureProfile(supabase, data.user);

    const role = normalizeRole(
      (profile?.role as string | undefined) || data.user?.user_metadata?.role
    );

    return NextResponse.json({ role });
  } catch (err: any) {
    console.error("LIFF Auth exception:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
