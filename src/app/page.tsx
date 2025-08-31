"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

type Folder = {
  id: string;
  name: string;
  parent_id: string | null;
  is_public: boolean;
  user_id: string;
  created_at: string;
};

export default function HomePage() {
  const router = useRouter();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [newFolder, setNewFolder] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // search & filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [scope, setScope] = useState<"my" | "public">("my");

  // 🔐 Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) console.error("Auth error:", error);

      if (!user) {
        router.push("/signin"); // 🚨 block unauthenticated users
      } else {
        setUserId(user.id);
      }
      setAuthLoading(false);
    };

    fetchUser();
  }, [router]);

  // 📂 Fetch folders
  const fetchFolders = async () => {
    if (scope === "my" && !userId) return;

    let query = supabase
      .from("folders")
      .select("*")
      .order("created_at", { ascending: false });

    if (scope === "my") {
      if (searchQuery.trim() === "") {
        // show only top-level if not searching
        query = query.eq("user_id", userId).is("parent_id", null);
      } else {
        // search across ALL my folders + subfolders
        query = query.eq("user_id", userId);
      }
    } else {
      // 🌍 Public scope
      query = query.eq("is_public", true);
    }

    // 🔍 Apply search filter
    if (searchQuery.trim() !== "") {
      query = query.ilike("name", `%${searchQuery}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Fetch folders error:", error);
    } else {
      setFolders(data || []);
    }
  };

  // ➕ Create folder
  const createFolder = async () => {
    if (!newFolder || !userId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("folders")
      .insert([
        {
          name: newFolder,
          user_id: userId,
          parent_id: null,
          is_public: isPublic,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Create folder error:", error);
    } else if (data) {
      setFolders((prev) => [data, ...prev]);
      setNewFolder("");
      setIsPublic(false);
    }

    setLoading(false);
  };

  // 📂 Navigate to folder page
  const openFolder = (folder: Folder) => {
    router.push(`/folders/${folder.id}`);
  };

  // 🔁 Fetch whenever filters change
  useEffect(() => {
    if (userId || scope === "public") {
      fetchFolders();
    }
  }, [userId, searchQuery, scope]);

  if (authLoading) {
    return <p className="p-6 text-center">🔐 Checking authentication...</p>;
  }

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">
        {scope === "my" ? "📂 My Folders" : "🌍 Public Folders"}
      </h1>

      {/* scope switcher */}
      <div className="flex gap-3 mb-6">
        <Button
          variant={scope === "my" ? "default" : "outline"}
          onClick={() => setScope("my")}
        >
          My Folders
        </Button>
        <Button
          variant={scope === "public" ? "default" : "outline"}
          onClick={() => setScope("public")}
        >
          Public Folders
        </Button>
      </div>

      {/* create folder form (only my scope) */}
      {scope === "my" && (
        <div className="flex gap-2 mb-6 items-center">
          <Input
            value={newFolder}
            onChange={(e) => setNewFolder(e.target.value)}
            placeholder="New folder name..."
          />
          <label className="flex items-center gap-1 text-sm">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
            Public
          </label>
          <Button onClick={createFolder} disabled={loading}>
            {loading ? "Creating..." : "Create"}
          </Button>
        </div>
      )}

      {/* search */}
      <div className="flex gap-3 mb-6 items-center">
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="🔍 Search folders..."
          className="flex-1"
        />
      </div>

      {/* folders list */}
      <div className="grid gap-3">
        {folders.map((folder) => (
          <Card
            key={folder.id}
            className="cursor-pointer hover:shadow-lg"
            onClick={() => openFolder(folder)}
          >
            <CardContent className="p-4 flex justify-between items-center">
              <p className="font-medium">{folder.name}</p>
              {folder.is_public && (
                <span className="text-sm text-green-600 font-semibold">
                  Public
                </span>
              )}
            </CardContent>
          </Card>
        ))}
        {folders.length === 0 && (
          <p className="text-gray-500 text-center">No folders found.</p>
        )}
      </div>
    </main>
  );
}
