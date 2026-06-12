import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase-server";
import { ensureProfile } from "@/app/lib/ensure-profile";
import { normalizeRole } from "@/app/lib/roles";

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { error: "idToken is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    let { data, error } = await supabase.auth.signInWithIdToken({
      provider: "line" as any,
      token: idToken,
    });

    if (error) {
      const isLocal = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("localhost") || process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("127.0.0.1");

      if (isLocal) {
        console.warn("Falling back to local LINE mock auth because native provider failed.");
        try {
          const payloadBase64 = idToken.split(".")[1];
          const payload = JSON.parse(Buffer.from(payloadBase64, "base64").toString("utf8"));
          const lineId = payload.sub;
          const email = `${lineId}@line.mock.local`;
          const password = `line-mock-${lineId}`;

          let mockAuth = await supabase.auth.signInWithPassword({ email, password });

          if (mockAuth.error) {
            mockAuth = await supabase.auth.signUp({
              email,
              password,
              options: {
                data: {
                  full_name: payload.name,
                  avatar_url: payload.picture,
                },
              },
            });
          }

          if (mockAuth.error) throw mockAuth.error;
          data = mockAuth.data as any;
          error = null;
        } catch (mockErr: any) {
          console.error("Mock auth failed:", mockErr.message);
          return NextResponse.json({ error: "Local mock auth failed: " + mockErr.message }, { status: 401 });
        }
      } else {
        console.error("LIFF signInWithIdToken error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
    }

    if (!data?.user || !data?.session) {
      return NextResponse.json({ error: "No user or session returned (Email confirmation might be required)" }, { status: 401 });
    }

    // Ensure profile exists
    const profile = await ensureProfile(supabase, data.user);

    const role = normalizeRole(
      (profile?.role as string | undefined) || data.user?.user_metadata?.role
    );

    return NextResponse.json({ role });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
