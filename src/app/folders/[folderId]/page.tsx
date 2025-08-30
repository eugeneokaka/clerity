"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

type Note = {
  id: string;
  title: string;
  content: string;
  is_public: boolean;
  created_at: string;
};

type Folder = {
  id: string;
  name: string;
  is_public: boolean;
  parent_id: string | null;
};

export default function FolderPage() {
  const router = useRouter();
  const params = useParams();
  const folderId = params?.folderId as string;

  const [notes, setNotes] = useState<Note[]>([]);
  const [subfolders, setSubfolders] = useState<Folder[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
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

  // Fetch notes
  const fetchNotes = async () => {
    if (!userId || !folderId) return;
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("folder_id", folderId)
      .eq("user_id", userId);

    if (error) console.error("Fetch notes error:", error);
    else setNotes(data || []);
  };

  // Fetch subfolders
  const fetchSubfolders = async () => {
    if (!userId || !folderId) return;
    const { data, error } = await supabase
      .from("folders")
      .select("*")
      .eq("parent_id", folderId)
      .eq("user_id", userId);

    if (error) console.error("Fetch subfolders error:", error);
    else setSubfolders(data || []);
  };

  // Create a new note
  const createNote = async () => {
    if (!newTitle || !folderId || !userId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("notes")
      .insert([
        {
          folder_id: folderId,
          user_id: userId,
          title: newTitle,
          content: newContent,
          is_public: isPublic,
        },
      ])
      .select()
      .single();

    if (error) console.error("Create note error:", error);
    else if (data) {
      setNotes((prev) => [...prev, data]);
      setNewTitle("");
      setNewContent("");
      setIsPublic(false);
    }

    setLoading(false);
  };

  // Create subfolder
  const createSubfolder = async () => {
    if (!newFolderName || !folderId || !userId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("folders")
      .insert([
        {
          name: newFolderName,
          user_id: userId,
          parent_id: folderId,
          is_public: isPublic,
        },
      ])
      .select()
      .single();

    if (error) console.error("Create subfolder error:", error);
    else if (data) {
      setSubfolders((prev) => [...prev, data]);
      setNewFolderName("");
      setIsPublic(false);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (userId) {
      fetchNotes();
      fetchSubfolders();
    }
  }, [userId, folderId]);

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">📝 Folder</h1>
        <Button variant="outline" size="sm" onClick={() => router.push("/")}>
          ← Back to Folders
        </Button>
      </div>

      {/* Subfolder creation */}
      <div className="flex flex-col gap-2 mb-6">
        <Input
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          placeholder="New subfolder name..."
        />
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
          />
          Public
        </label>
        <Button onClick={createSubfolder} disabled={loading}>
          {loading ? "Creating..." : "Create Subfolder"}
        </Button>
      </div>

      {/* Subfolders list */}
      {subfolders.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">📂 Subfolders</h2>
          <div className="grid gap-3">
            {subfolders.map((folder) => (
              <Card
                key={folder.id}
                className="cursor-pointer hover:shadow-lg"
                onClick={() => router.push(`/folders/${folder.id}`)}
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
        </div>
      )}

      {/* Notes creation */}
      <div className="flex flex-col gap-2 mb-6">
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Note title..."
        />
        <Textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="Note content..."
        />
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
          />
          Public
        </label>
        <Button onClick={createNote} disabled={loading}>
          {loading ? "Creating..." : "Create Note"}
        </Button>
      </div>

      {/* Notes list */}
      <div className="grid gap-3">
        {notes.map((note) => (
          <Card
            key={note.id}
            className="cursor-pointer hover:shadow-lg"
            onClick={() => router.push(`/notes/${note.id}`)}
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <p className="font-medium">{note.title}</p>
                {note.is_public && (
                  <span className="text-sm text-green-600 font-semibold">
                    Public
                  </span>
                )}
              </div>
              <p className="mt-1 text-gray-700">
                {note.content.length > 100
                  ? note.content.substring(0, 100) + "..."
                  : note.content}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
