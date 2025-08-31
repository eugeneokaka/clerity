"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import RichTextEditor from "@/app/Components/editor";

type Note = {
  id: string;
  title: string;
  content: string;
  is_public: boolean;
  created_at: string;
  file_url?: string | null;
};

type Folder = {
  id: string;
  name: string;
  is_public: boolean;
  parent_id: string | null;
  user_id: string;
};

export default function FolderPage() {
  const router = useRouter();
  const params = useParams();
  const folderId = params?.folderId as string;

  const [notes, setNotes] = useState<Note[]>([]);
  const [subfolders, setSubfolders] = useState<Folder[]>([]);
  const [folder, setFolder] = useState<Folder | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // PDF upload
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id || null);
    };
    fetchUser();
  }, []);

  // Fetch folder details
  const fetchFolder = async () => {
    if (!folderId) return;
    const { data, error } = await supabase
      .from("folders")
      .select("*")
      .eq("id", folderId)
      .single();

    if (error) console.error("Fetch folder error:", error);
    else setFolder(data);
  };

  // Fetch notes
  const fetchNotes = async () => {
    if (!folderId) return;

    // if user owns folder → fetch their notes
    // if viewing public folder → fetch only public notes
    const query = supabase.from("notes").select("*").eq("folder_id", folderId);

    if (folder?.user_id === userId) {
      query.eq("user_id", userId);
    } else {
      query.eq("is_public", true);
    }

    const { data, error } = await query;

    if (error) console.error("Fetch notes error:", error);
    else setNotes(data || []);
  };

  // Fetch subfolders
  const fetchSubfolders = async () => {
    if (!folderId) return;

    const query = supabase
      .from("folders")
      .select("*")
      .eq("parent_id", folderId);

    if (folder?.user_id === userId) {
      query.eq("user_id", userId);
    } else {
      query.eq("is_public", true);
    }

    const { data, error } = await query;

    if (error) console.error("Fetch subfolders error:", error);
    else setSubfolders(data || []);
  };

  useEffect(() => {
    fetchFolder();
  }, [folderId]);

  useEffect(() => {
    if (folder) {
      fetchNotes();
      fetchSubfolders();
    }
  }, [folder, userId]);

  const isOwner = folder?.user_id === userId;

  // -----------------------------
  // CREATE NOTE / SUBFOLDER / PDF
  // -----------------------------

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

  const uploadPdf = async () => {
    if (!pdfFile || !folderId || !userId) return;
    setUploadingPdf(true);

    const fileName = `${userId}/${Date.now()}-${pdfFile.name}`;

    // Upload to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from("clarity-files")
      .upload(fileName, pdfFile);

    if (uploadError) {
      console.error("PDF upload error:", uploadError);
      setUploadingPdf(false);
      return;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("clarity-files")
      .getPublicUrl(fileName);

    const fileUrl = urlData.publicUrl;

    // Insert into notes
    const { data, error } = await supabase
      .from("notes")
      .insert([
        {
          folder_id: folderId,
          user_id: userId,
          title: pdfFile.name,
          content: "",
          file_url: fileUrl,
          is_public: isPublic,
        },
      ])
      .select()
      .single();

    if (error) console.error("Save PDF note error:", error);
    else if (data) {
      setNotes((prev) => [...prev, data]);
      setPdfFile(null);
    }

    setUploadingPdf(false);
  };

  // -----------------------------
  // RENDER
  // -----------------------------
  return (
    <main className="p-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">📝 {folder?.name || "Folder"}</h1>
        <Button variant="outline" size="sm" onClick={() => router.push("/")}>
          ← Back to Folders
        </Button>
      </div>

      {/* Show create forms only if owner */}
      {isOwner && (
        <>
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

          {/* Notes creation */}
          <div className="flex flex-col gap-2 mb-6">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Note title..."
            />
            <RichTextEditor content={newContent} onChange={setNewContent} />
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

          {/* PDF Upload */}
          <div className="flex flex-col gap-2 mb-6 border p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold">📄 Upload PDF</h2>
            <Input
              type="file"
              accept="application/pdf"
              onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
            />
            <Button onClick={uploadPdf} disabled={uploadingPdf || !pdfFile}>
              {uploadingPdf ? "Uploading..." : "Upload PDF"}
            </Button>
          </div>
        </>
      )}

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
              {note.file_url ? (
                <a
                  href={note.file_url}
                  target="_blank"
                  className="text-blue-600 underline mt-2 block"
                >
                  View PDF
                </a>
              ) : (
                <div
                  className="mt-1 text-gray-700 prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: note.content }}
                />
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
