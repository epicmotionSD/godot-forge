import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { encrypt } from "@/lib/crypto";

// ---------- GET: retrieve deploy config (credentials masked) ----------

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("projects")
    .select(
      "deploy_to_steam, steam_app_id, steam_depot_map, steam_branch, steam_username_enc, steam_password_enc, deploy_to_itch, itch_game_slug, itch_api_key_enc"
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({
    steam: {
      enabled: data.deploy_to_steam ?? false,
      appId: data.steam_app_id ?? "",
      depotMap: data.steam_depot_map ?? {},
      branch: data.steam_branch ?? "default",
      hasUsername: !!data.steam_username_enc,
      hasPassword: !!data.steam_password_enc,
    },
    itch: {
      enabled: data.deploy_to_itch ?? false,
      game: data.itch_game_slug ?? "",
      hasApiKey: !!data.itch_api_key_enc,
    },
  });
}

// ---------- POST: save deploy config ----------

interface SteamInput {
  enabled?: boolean;
  appId?: string;
  depotMap?: Record<string, string>;
  branch?: string;
  username?: string;
  password?: string;
}

interface ItchInput {
  enabled?: boolean;
  game?: string;
  apiKey?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const steam = body.steam as SteamInput | undefined;
  const itch = body.itch as ItchInput | undefined;

  const updates: Record<string, unknown> = {};

  // --- Steam ---
  if (steam) {
    if (typeof steam.enabled === "boolean") updates.deploy_to_steam = steam.enabled;
    if (typeof steam.appId === "string") {
      if (steam.appId && !/^\d+$/.test(steam.appId)) {
        return NextResponse.json({ error: "Steam App ID must be numeric" }, { status: 400 });
      }
      updates.steam_app_id = steam.appId || null;
    }
    if (steam.depotMap !== undefined) {
      const map = steam.depotMap;
      if (typeof map !== "object" || Array.isArray(map)) {
        return NextResponse.json({ error: "depotMap must be an object" }, { status: 400 });
      }
      for (const v of Object.values(map)) {
        if (!/^\d+$/.test(v)) {
          return NextResponse.json({ error: "Depot IDs must be numeric" }, { status: 400 });
        }
      }
      updates.steam_depot_map = map;
    }
    if (typeof steam.branch === "string") updates.steam_branch = steam.branch || "default";
    if (typeof steam.username === "string") {
      updates.steam_username_enc = steam.username ? encrypt(steam.username) : null;
    }
    if (typeof steam.password === "string") {
      updates.steam_password_enc = steam.password ? encrypt(steam.password) : null;
    }
  }

  // --- itch.io ---
  if (itch) {
    if (typeof itch.enabled === "boolean") updates.deploy_to_itch = itch.enabled;
    if (typeof itch.game === "string") {
      if (itch.game && !itch.game.includes("/")) {
        return NextResponse.json(
          { error: 'itch.io game slug must be "user/game" format' },
          { status: 400 }
        );
      }
      updates.itch_game_slug = itch.game || null;
    }
    if (typeof itch.apiKey === "string") {
      updates.itch_api_key_enc = itch.apiKey ? encrypt(itch.apiKey) : null;
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  const { error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  // Re-read to return masked config
  const { data: fresh } = await supabase
    .from("projects")
    .select(
      "deploy_to_steam, steam_app_id, steam_depot_map, steam_branch, steam_username_enc, steam_password_enc, deploy_to_itch, itch_game_slug, itch_api_key_enc"
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!fresh) {
    return NextResponse.json({ saved: true });
  }

  return NextResponse.json({
    saved: true,
    steam: {
      enabled: fresh.deploy_to_steam ?? false,
      appId: fresh.steam_app_id ?? "",
      depotMap: fresh.steam_depot_map ?? {},
      branch: fresh.steam_branch ?? "default",
      hasUsername: !!fresh.steam_username_enc,
      hasPassword: !!fresh.steam_password_enc,
    },
    itch: {
      enabled: fresh.deploy_to_itch ?? false,
      game: fresh.itch_game_slug ?? "",
      hasApiKey: !!fresh.itch_api_key_enc,
    },
  });
}
