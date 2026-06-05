import { NextRequest } from "next/server";
import { createClient } from "@/app/lib/supabase-server";

// GET — fetch all categories
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const enabledOnly = request.nextUrl.searchParams.get("enabled");

  let query = supabase.from("categories").select("*");
  if (enabledOnly === "true") {
    query = query.eq("enabled", true);
  }

  try {
    const { data, error } = await query;
    if (error) {
      console.error("Supabase error fetching categories:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Format icon_name -> iconName for the frontend
    const formatted = (data || []).map((cat: any) => ({
      ...cat,
      iconName: cat.icon_name,
    }));

    return Response.json(formatted);
  } catch (err: any) {
    console.error("Internal server error in categories API:", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST — add a new category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, subtitle, description, iconName, color, subcategories } =
      body;

    if (!title || !iconName || !color) {
      return Response.json(
        { error: "title, iconName, and color are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("categories")
      .insert({
        title,
        subtitle: subtitle || "",
        description: description || "",
        icon_name: iconName,
        color,
        enabled: true,
        subcategories: subcategories || [],
      })
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const formatted = {
      ...data,
      iconName: data.icon_name,
    };

    return Response.json(formatted, { status: 201 });
  } catch (err: any) {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
}

// PUT — update a category
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, iconName, ...updates } = body;

    if (!id) {
      return Response.json({ error: "id is required" }, { status: 400 });
    }

    const mappedUpdates: any = { ...updates };
    if (iconName !== undefined) {
      mappedUpdates.icon_name = iconName;
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("categories")
      .update(mappedUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const formatted = {
      ...data,
      iconName: data.icon_name,
    };

    return Response.json(formatted);
  } catch (err: any) {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
}

// DELETE — delete a category by id
export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return Response.json(
      { error: "id query param is required" },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}
