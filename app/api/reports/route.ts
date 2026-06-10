import { NextRequest } from "next/server";
import { createClient } from "@/app/lib/supabase-server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allReports = request.nextUrl.searchParams.get("all") === "true";

  if (allReports) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  let query = supabase.from("reports").select("*").order("created_at", { ascending: false });

  if (!allReports) {
    query = query.eq("user_id", user.id);
  }

  const { data, error } = await query;

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data || []);
}

export async function POST(request: NextRequest) {
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
    const {
      category_id,
      category_title,
      category_color,
      subcategory,
      description,
      contact,
      image,
      latitude,
      longitude,
      location_address,
    } = body;

    if (!category_id || !subcategory || !String(description || "").trim()) {
      return Response.json(
        { error: "category_id, subcategory, and description are required" },
        { status: 400 }
      );
    }

    const lat = latitude != null ? Number(latitude) : null;
    const lng = longitude != null ? Number(longitude) : null;

    if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) {
      return Response.json(
        { error: "latitude and longitude are required" },
        { status: 400 }
      );
    }

    const { data: reportData, error: insertError } = await supabase
      .from("reports")
      .insert({
        user_id: user.id,
        category_id,
        category_title: category_title || "หมวดหมู่อื่นๆ",
        category_color: category_color || "#64748B",
        subcategory,
        description: String(description).trim(),
        contact: String(contact || "").trim(),
        image: image || null,
        latitude: lat,
        longitude: lng,
        location_address: location_address ? String(location_address).trim() : null,
        status: "รอดำเนินการ",
      })
      .select("id")
      .single();

    if (insertError) {
      return Response.json({ error: insertError.message }, { status: 500 });
    }

    try {
      const { data: admins } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "admin");

      if (admins && admins.length > 0 && reportData) {
        const title = body.notification_title || "มีรายการแจ้งเหตุใหม่ 📢";
        const content =
          body.notification_content ||
          `หัวข้อ: ${subcategory}\nผู้แจ้ง: ${String(contact || "").trim() || "ไม่ระบุชื่อ"}\nรายละเอียด: ${String(description).trim().slice(0, 60)}...`;

        const adminNotifs = admins.map((admin) => ({
          user_id: admin.id,
          title,
          content,
          report_id: reportData.id,
          read: false,
        }));

        const { error: notifError } = await supabase
          .from("notifications")
          .insert(adminNotifs);

        if (notifError) {
          console.error("Failed to insert admin notifications:", notifError.message);
        }
      }
    } catch (notifErr) {
      console.error("Notification fan-out failed:", notifErr);
    }

    return Response.json(reportData, { status: 201 });
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return Response.json({ error: "id query param is required" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: existingReport, error: reportError } = await supabase
    .from("reports")
    .select("id, user_id")
    .eq("id", id)
    .single();

  if (reportError || !existingReport) {
    return Response.json({ error: "Report not found" }, { status: 404 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";
  const isOwner = existingReport.user_id === user.id;

  if (!isAdmin && !isOwner) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase.from("reports").delete().eq("id", id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}
