import { NextRequest } from "next/server";
import { createClient } from "@/app/lib/supabase-server";

type RouteContext = { params: Promise<{ id: string }> };

async function notifyAdmins(
  supabase: Awaited<ReturnType<typeof createClient>>,
  reportId: string,
  title: string,
  content: string
) {
  try {
    const { data: admins } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "admin");

    if (admins && admins.length > 0) {
      const adminNotifs = admins.map((admin) => ({
        user_id: admin.id,
        title,
        content,
        report_id: reportId,
        read: false,
      }));

      const { error } = await supabase.from("notifications").insert(adminNotifs);
      if (error) {
        console.error("Failed to insert admin notifications:", error.message);
      }
    }
  } catch (err) {
    console.error("Admin notification fan-out failed:", err);
  }
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: report, error } = await supabase
    .from("reports")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !report) {
    return Response.json({ error: "Report not found" }, { status: 404 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";
  const isOwner = report.user_id === user.id;

  if (!isAdmin && !isOwner) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  return Response.json(report);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: existingReport, error: fetchError } = await supabase
    .from("reports")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !existingReport) {
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

  try {
    const body = await request.json();
    const reportLabel =
      existingReport.subcategory || existingReport.category_title || "รายการแจ้งเหตุ";
    const nowIso = new Date().toISOString();


    // Admin status update: only when the request is explicitly sending "status".
    // This allows an admin who is also the report owner to edit description/contact
    // via the owner-update path (without being forced to send status).
    if (isAdmin && "status" in body) {
      const { status, completion_image, rejection_reason } = body;

      if (!status) {
        return Response.json({ error: "status is required" }, { status: 400 });
      }

      if (status === "เสร็จสิ้น" && !completion_image) {
        return Response.json(
          { error: "completion_image is required when marking as complete" },
          { status: 400 }
        );
      }

      if (status === "ปฏิเสธ" && !String(rejection_reason || "").trim()) {
        return Response.json(
          { error: "rejection_reason is required when rejecting a report" },
          { status: 400 }
        );
      }

      const updatePayload: Record<string, unknown> = { status };
      if (status === "เสร็จสิ้น") {
        updatePayload.completion_image = completion_image;
      }
      if (status === "ปฏิเสธ") {
        updatePayload.rejection_reason = String(rejection_reason || "").trim();
        updatePayload.rejected_at = nowIso;
      }
      // Track working time milestones (optional columns)
      if (status === "กำลังดำเนินการ" && !existingReport.in_progress_at) {
        updatePayload.in_progress_at = nowIso;
      }
      if (status === "เสร็จสิ้น" && !existingReport.completed_at) {
        updatePayload.completed_at = nowIso;
      }

      let report: any = null;
      let updateError: any = null;

      // Some environments may not have the new timestamp columns yet.
      // If the update fails due to missing columns, retry without them.
      {
        const res = await supabase
          .from("reports")
          .update(updatePayload)
          .eq("id", id)
          .select("*")
          .single();
        report = res.data;
        updateError = res.error;
      }

      if (
        updateError &&
        typeof updateError.message === "string" &&
        updateError.message.includes("does not exist")
      ) {
        const retryPayload = { ...updatePayload } as Record<string, unknown>;
        delete retryPayload.in_progress_at;
        delete retryPayload.completed_at;
        delete retryPayload.rejected_at;
        delete retryPayload.rejection_reason;
        const retryRes = await supabase
          .from("reports")
          .update(retryPayload)
          .eq("id", id)
          .select("*")
          .single();
        report = retryRes.data;
        updateError = retryRes.error;
      }

      if (updateError) {
        return Response.json({ error: updateError.message }, { status: 500 });
      }

      if (report?.user_id) {
        const title =
          status === "ปฏิเสธ" ? "รายการแจ้งเหตุถูกปฏิเสธ" : "อัปเดตสถานะแจ้งเหตุ";
        const content =
          status === "ปฏิเสธ"
            ? `รายการ "${reportLabel}" ถูกปฏิเสธ\nเหตุผล: ${String(rejection_reason || "").trim()}`
            : `รายการ "${reportLabel}" ถูกเปลี่ยนสถานะเป็น "${status}"`;

        const { error: ownerNotifError } = await supabase.from("notifications").insert({
          user_id: report.user_id,
          title,
          content,
          report_id: id,
          read: false,
        });

        if (ownerNotifError) {
          console.error("Failed to insert owner notification:", ownerNotifError.message);
        }
      }

      await notifyAdmins(
        supabase,
        id,
        "🔄 อัปเดตสถานะรายการแจ้งเหตุ",
        status === "ปฏิเสธ"
          ? `รายการ "${reportLabel}" ถูกปฏิเสธ\nจาก: ${existingReport.contact || "ไม่ระบุชื่อ"}\nเหตุผล: ${String(rejection_reason || "").trim()}`
          : `รายการ "${reportLabel}" ถูกเปลี่ยนสถานะเป็น "${status}"\nจาก: ${existingReport.contact || "ไม่ระบุชื่อ"}`
      );

      return Response.json(report);
    }

    // Owner update
    if (existingReport.status === "เสร็จสิ้น") {
      return Response.json(
        { error: "Cannot edit a completed report" },
        { status: 400 }
      );
    }

    const description = body.description;
    const contact = body.contact;
    const image = body.image;

    if (!description || !String(description).trim()) {
      return Response.json({ error: "description is required" }, { status: 400 });
    }

    const updatePayload: Record<string, unknown> = {
      description: String(description).trim(),
      contact: String(contact || "").trim(),
    };

    if (image !== undefined) {
      updatePayload.image = image || null;
    }

    const wasInfoRequested = existingReport.status === "ขอข้อมูลเพิ่ม";
    if (wasInfoRequested) {
      updatePayload.status = "กำลังดำเนินการ";
      if (!existingReport.in_progress_at) {
        updatePayload.in_progress_at = nowIso;
      }
    }

    let report: any = null;
    let updateError: any = null;
    {
      const res = await supabase
        .from("reports")
        .update(updatePayload)
        .eq("id", id)
        .select("*")
        .single();
      report = res.data;
      updateError = res.error;
    }

    if (
      updateError &&
      typeof updateError.message === "string" &&
      updateError.message.includes("does not exist")
    ) {
      const retryPayload = { ...updatePayload } as Record<string, unknown>;
      delete retryPayload.in_progress_at;
      delete retryPayload.completed_at;
      const retryRes = await supabase
        .from("reports")
        .update(retryPayload)
        .eq("id", id)
        .select("*")
        .single();
      report = retryRes.data;
      updateError = retryRes.error;
    }

    if (updateError) {
      return Response.json({ error: updateError.message }, { status: 500 });
    }

    if (wasInfoRequested) {
      await notifyAdmins(
        supabase,
        id,
        "📩 ผู้ใช้ส่งข้อมูลเพิ่มเติม",
        `ผู้แจ้ง "${existingReport.contact || "ไม่ระบุชื่อ"}" ได้แก้ไขและส่งข้อมูลสำหรับรายการ "${reportLabel}" แล้ว`
      );
    }

    return Response.json(report);
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
}
