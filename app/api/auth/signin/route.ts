import { NextRequest } from "next/server";
import { createClient } from "@/app/lib/supabase-server";
import { normalizeRole } from "@/app/lib/roles";
import { ensureProfile } from "@/app/lib/ensure-profile";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return Response.json({ error: "Email and password are required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return Response.json({ error: error.message }, { status: 401 });
    }

    // Ensure profile row exists (handles edge case where trigger failed)
    const profile = await ensureProfile(supabase, data.user);

    const role = normalizeRole(
      (profile?.role as string | undefined) || data.user.user_metadata?.role
    );

    return Response.json({ role });
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
}
