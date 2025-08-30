// // app/api/folders/route.ts
// import { NextResponse } from "next/server";
// import { supabase } from "@/lib/supabaseClient"; // ✅ your configured client
// import { cookies } from "next/headers";

// export async function GET() {
//   const cookieStore = cookies();
//   const supabaseClient = supabase(cookieStore);

//   const {
//     data: { user },
//     error: userError,
//   } = await supabaseClient.auth.getUser();

//   if (userError || !user) {
//     return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
//   }

//   const { data, error } = await supabaseClient
//     .from("folders")
//     .select("*")
//     .eq("user_id", user.id);

//   if (error) {
//     return NextResponse.json({ error: error.message }, { status: 400 });
//   }

//   return NextResponse.json({ folders: data });
// }

// export async function POST(req: Request) {
//   const cookieStore = cookies();
//   const supabaseClient = supabase(cookieStore);

//   const {
//     data: { user },
//     error: userError,
//   } = await supabaseClient.auth.getUser();

//   if (userError || !user) {
//     return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
//   }

//   const body = await req.json();
//   const { name, parent_id } = body;

//   const { data, error } = await supabaseClient
//     .from("folders")
//     .insert([
//       {
//         user_id: user.id,
//         name,
//         parent_id: parent_id || null,
//       },
//     ])
//     .select()
//     .single();

//   if (error) {
//     return NextResponse.json({ error: error.message }, { status: 400 });
//   }

//   return NextResponse.json({ folder: data });
// }
