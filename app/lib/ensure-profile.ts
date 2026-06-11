import type { SupabaseClient, User } from "@supabase/supabase-js";

/**
 * Ensure a profile row exists for the given user.
 *
 * After OAuth sign-in the `handle_new_user` trigger *should* create the row,
 * but it can fail silently (e.g. the trigger ran before the migration that added
 * ON CONFLICT, or the row was accidentally deleted).
 *
 * This helper performs a lightweight upsert that:
 *  - Creates the row with sensible defaults if missing.
 *  - Updates email / display_name / avatar_url from the latest provider metadata
 *    when they are empty in the existing row.
 *  - Never overwrites the `role` column — that's managed by an admin.
 *
 * Returns the profile row (or null on error).
 */
export async function ensureProfile(
  supabase: SupabaseClient,
  user: User
): Promise<Record<string, unknown> | null> {
  const meta = user.user_metadata ?? {};

  const displayName =
    meta.display_name ?? meta.full_name ?? meta.name ?? null;
  const avatarUrl =
    meta.avatar_url ?? meta.picture ?? meta.picture_url ?? null;
  const phone = meta.phone ?? null;

  // Try to fetch existing profile first
  const { data: existing } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (existing) {
    // Update only empty fields (don't overwrite user-edited data)
    const updates: Record<string, unknown> = {};
    if (!existing.email && user.email) updates.email = user.email;
    if (!existing.display_name && displayName) updates.display_name = displayName;
    if (!existing.avatar_url && avatarUrl) updates.avatar_url = avatarUrl;

    if (Object.keys(updates).length > 0) {
      await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);
    }

    return { ...existing, ...updates };
  }

  // Profile doesn't exist — create it
  const { data: newProfile, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email: user.email,
        phone,
        role: "member",
        display_name: displayName,
        avatar_url: avatarUrl,
      },
      { onConflict: "id" }
    )
    .select("*")
    .single();

  if (error) {
    console.error("ensureProfile upsert error:", error.message);
    return null;
  }

  return newProfile;
}
