import { NextRequest } from "next/server";
import { createClient } from "@/app/lib/supabase-server";
import { ensureProfile } from "@/app/lib/ensure-profile";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const includeAvatar =
    request.nextUrl.searchParams.get("includeAvatar") === "true";

  const selectFields = includeAvatar
    ? "*"
    : "id, email, phone, role, created_at, display_name, address, bio, dark_mode, large_text, language";

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select(selectFields)
    .eq("id", user.id)
    .single();

  if (profileError) {
    // Profile row missing — ensure it exists (fixes OAuth trigger failures)
    const ensured = await ensureProfile(supabase, user);
    if (ensured) {
      return Response.json(ensured);
    }

    // Ultimate fallback from auth metadata
    return Response.json({
      id: user.id,
      email: user.email,
      phone: user.user_metadata?.phone || "",
      role: user.user_metadata?.role === "normaluser" ? "member" : user.user_metadata?.role || "member",
      created_at: user.created_at,
      display_name: "",
      avatar_url: "",
      address: "",
      bio: "",
    });
  }

  return Response.json(profileData);
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const phoneClean = String(body.phone || "").replace(/[^0-9]/g, "");

    if (phoneClean && (phoneClean.length < 9 || phoneClean.length > 10)) {
      return Response.json(
        { error: "Phone number must be 9-10 digits" },
        { status: 400 }
      );
    }

    const profilePayload: Record<string, unknown> = {
      id: user.id,
      email: user.email,
      phone: phoneClean || null,
      display_name: body.display_name || null,
      address: body.address || null,
      bio: body.bio || null,
    };

    if ("avatar_url" in body) {
      profilePayload.avatar_url = body.avatar_url || null;
    }

    const { data, error: updateError } = await supabase
      .from("profiles")
      .upsert(profilePayload, { onConflict: "id" })
      .select("id, email, phone, role, created_at, display_name, address, bio, dark_mode, large_text, language")
      .single();

    if (updateError) {
      return Response.json({ error: updateError.message }, { status: 500 });
    }

    const currentPhone = String(user.user_metadata?.phone || "").replace(/[^0-9]/g, "");
    if (phoneClean !== currentPhone) {
      void supabase.auth.updateUser({ data: { phone: phoneClean } });
    }

    return Response.json(data);
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
}
