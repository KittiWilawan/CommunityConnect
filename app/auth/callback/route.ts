import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase-server";
import { normalizeRole } from "@/app/lib/roles";
import { getAuthDestination } from "@/app/lib/auth-session";
import { ensureProfile } from "@/app/lib/ensure-profile";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // If caller explicitly passed a "next" param, respect it.
      if (next) {
        return NextResponse.redirect(`${origin}${next}`);
      }

      // Otherwise, route by role (admin -> /admindashboard, others -> /Dashboard)
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Ensure profile row exists (fixes OAuth users whose trigger failed)
        const profile = await ensureProfile(supabase, user);

        const role = normalizeRole(
          profile?.role as string | undefined ||
          user.user_metadata?.role
        );
        const dest = getAuthDestination(role);
        return NextResponse.redirect(`${origin}${dest}`);
      }

      return NextResponse.redirect(`${origin}/Dashboard`);
    }
  }

  // return the user to the home page (which has LoginCard)
  return NextResponse.redirect(`${origin}/`);
}
