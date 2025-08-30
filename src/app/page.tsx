"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation"; // For navigation
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

type Folder = {
  id: string;
  name: string;
  parent_id: string | null;
  is_public: boolean;
};

export default function HomePage() {
  const router = useRouter();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [newFolder, setNewFolder] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id || null);
    };
    fetchUser();
  }, []);

  // Fetch root folders
  const fetchFolders = async () => {
    if (!userId) return;

    const { data, error } = await supabase
      .from("folders")
      .select("*")
      .eq("user_id", userId)
      .is("parent_id", null); // root folders only

    if (error) console.error("Fetch folders error:", error);
    else setFolders(data || []);
  };

  // Create folder
  const createFolder = async () => {
    if (!newFolder || !userId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("folders")
      .insert([
        {
          name: newFolder,
          user_id: userId,
          parent_id: null, // always root
          is_public: isPublic,
        },
      ])
      .select()
      .single();

    if (error) console.error("Create folder error:", error);
    else if (data) {
      setFolders((prev) => [...prev, data]);
      setNewFolder("");
      setIsPublic(false);
    }

    setLoading(false);
  };

  // Navigate to folder page
  const openFolder = (folder: Folder) => {
    router.push(`/folders/${folder.id}`);
  };

  // Initial fetch
  useEffect(() => {
    if (userId) fetchFolders();
  }, [userId]);

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">📂 My Folders</h1>

      <div className="flex gap-2 mb-4 items-center">
        <Input
          value={newFolder}
          onChange={(e) => setNewFolder(e.target.value)}
          placeholder="New folder name..."
        />
        <label className="flex items-center gap-1">
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
      </div>
    </main>
  );
}
