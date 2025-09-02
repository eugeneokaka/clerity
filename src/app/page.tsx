"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { FolderPlus, Folder, Globe, Search } from "lucide-react"; // icons

type FolderType = {
  id: string;
  name: string;
  parent_id: string | null;
  is_public: boolean;
  user_id: string;
  created_at: string;
};

export default function HomePage() {
  const router = useRouter();
  const [folders, setFolders] = useState<FolderType[]>([]);
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
        query = query.eq("user_id", userId).is("parent_id", null);
      } else {
        query = query.eq("user_id", userId);
      }
    } else {
      query = query.eq("is_public", true);
    }

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

  const openFolder = (folder: FolderType) => {
    router.push(`/folders/${folder.id}`);
  };

  useEffect(() => {
    if (userId || scope === "public") {
      fetchFolders();
    }
  }, [userId, searchQuery, scope]);

  if (authLoading) {
    return <p className="p-6 text-center">🔐 Checking authentication...</p>;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-10 px-6 shadow-md">
        <h1 className="text-3xl font-bold mb-2">AI Study App</h1>
        <p className="text-sm opacity-90">
          Organize your notes & folders, upload PDFs, and explore public study
          resources.
        </p>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Scope Switcher */}
        <div className="flex gap-3 mb-6 justify-center">
          <Button
            variant={scope === "my" ? "default" : "outline"}
            onClick={() => setScope("my")}
          >
            <Folder className="w-4 h-4 mr-1" /> My Folders
          </Button>
          <Button
            variant={scope === "public" ? "default" : "outline"}
            onClick={() => setScope("public")}
          >
            <Globe className="w-4 h-4 mr-1" /> Public
          </Button>
        </div>

        {/* Create Folder Form */}
        {scope === "my" && (
          <div className="bg-white shadow rounded-xl p-4 mb-6 flex items-center gap-3">
            <Input
              value={newFolder}
              onChange={(e) => setNewFolder(e.target.value)}
              placeholder="📂 New folder name..."
              className="flex-1"
            />
            <label className="flex items-center gap-1 text-sm whitespace-nowrap">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              Public
            </label>
            <Button onClick={createFolder} disabled={loading}>
              <FolderPlus className="w-4 h-4 mr-1" />
              {loading ? "Creating..." : "Create"}
            </Button>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search folders..."
            className="pl-10"
          />
        </div>

        {/* Folder List */}
        <div className="grid sm:grid-cols-2 gap-4">
          {folders.map((folder) => (
            <Card
              key={folder.id}
              className="cursor-pointer hover:shadow-lg transition rounded-xl"
              onClick={() => openFolder(folder)}
            >
              <CardContent className="p-5 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Folder className="w-5 h-5 text-indigo-600" />
                  <p className="font-medium">{folder.name}</p>
                </div>
                {folder.is_public && (
                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                    Public
                  </span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {folders.length === 0 && (
          <div className="text-center text-gray-500 mt-12">
            <Folder className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No folders found.</p>
          </div>
        )}
      </div>
    </main>
  );
}
