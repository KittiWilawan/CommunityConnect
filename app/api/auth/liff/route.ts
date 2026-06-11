import { NextRequest } from "next/server";
import { createClient } from "@/app/lib/supabase-server";
import { ensureProfile } from "@/app/lib/ensure-profile";
import { normalizeRole } from "@/app/lib/roles";

/**
 * POST /api/auth/liff
 *
 * Exchanges a LIFF ID token (JWT from LINE) for a Supabase session.
 * This endpoint is used when the app is opened inside LINE's in-app browser
 * via LIFF, where the user is already authenticated with LINE.
 *
 * Body: { idToken: string }
 * Returns: { role: string } on success
 */
export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return Response.json(
        { error: "idToken is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Use Supabase's signInWithIdToken to exchange the LIFF ID token
    // for a Supabase session. This works because LINE is configured
    // as an external OAuth provider in Supabase.
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: "line" as any,
      token: idToken,
    });

    if (error) {
      console.error("LIFF signInWithIdToken error:", error.message);
      return Response.json({ error: error.message }, { status: 401 });
    }

    if (!data.user) {
      return Response.json({ error: "No user returned" }, { status: 401 });
    }

    // Ensure profile exists
    const profile = await ensureProfile(supabase, data.user);

    const role = normalizeRole(
      (profile?.role as string | undefined) || data.user.user_metadata?.role
    );

    return Response.json({ role });
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
}
