import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// ✅ Get notes
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const folder_id = searchParams.get("folder_id");

  if (!folder_id) {
    return NextResponse.json({ error: "Missing folder_id" }, { status: 400 });
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("folder_id", folder_id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// ✅ Create note
export async function POST(req: Request) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { folder_id, title, file_url } = await req.json();

  if (!folder_id || !title) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("notes")
    .insert([{ folder_id, title, file_url }]) // ✅ no user_id here
    .select()
    .single();

  if (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
