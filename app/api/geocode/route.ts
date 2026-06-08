import { NextRequest } from "next/server";
import { BANGKOK_BOUNDS } from "@/app/lib/bangkok-bounds";

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
const USER_AGENT = "CommunityConnect/1.0 (location-picker)";

async function nominatimFetch(url: string) {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    return Response.json({ error: "Geocoding failed" }, { status: res.status });
  }
  const data = await res.json();
  return Response.json(data);
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type");
  const lang = searchParams.get("lang") === "en" ? "en" : "th";

  if (type === "reverse") {
    const lat = searchParams.get("lat");
    const lon = searchParams.get("lon");
    if (!lat || !lon) {
      return Response.json({ error: "lat and lon are required" }, { status: 400 });
    }
    const url = `${NOMINATIM_BASE}/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&format=json&accept-language=${lang}`;
    return nominatimFetch(url);
  }

  if (type === "search") {
    const q = searchParams.get("q")?.trim();
    if (!q || q.length < 2) {
      return Response.json([]);
    }
    const viewbox = [
      BANGKOK_BOUNDS.west,
      BANGKOK_BOUNDS.south,
      BANGKOK_BOUNDS.east,
      BANGKOK_BOUNDS.north,
    ].join(",");
    const url = `${NOMINATIM_BASE}/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=6&viewbox=${viewbox}&bounded=1&countrycodes=th&accept-language=${lang}`;
    return nominatimFetch(url);
  }

  return Response.json({ error: "Invalid type" }, { status: 400 });
}
