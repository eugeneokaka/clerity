"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import RichTextEditor from "@/app/Components/editor";
import { FolderPlus, Folder, FileText } from "lucide-react";

type Note = {
  id: string;
  title: string;
  content: string;
  is_public: boolean;
  created_at: string;
  file_url?: string | null;
};

type FolderType = {
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
  const [subfolders, setSubfolders] = useState<FolderType[]>([]);
  const [folder, setFolder] = useState<FolderType | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id || null);
    };
    fetchUser();
  }, []);

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

  const fetchNotes = async () => {
    if (!folderId) return;
    let query = supabase.from("notes").select("*").eq("folder_id", folderId);
    if (folder?.user_id === userId) query.eq("user_id", userId);
    else query.eq("is_public", true);
    const { data, error } = await query;
    if (error) console.error("Fetch notes error:", error);
    else setNotes(data || []);
  };

  const fetchSubfolders = async () => {
    if (!folderId) return;
    let query = supabase.from("folders").select("*").eq("parent_id", folderId);
    if (folder?.user_id === userId) query.eq("user_id", userId);
    else query.eq("is_public", true);
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

  // CREATE FUNCTIONS
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
    if (error) console.error(error);
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
    if (error) console.error(error);
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
    const { error: uploadError } = await supabase.storage
      .from("clarity-files")
      .upload(fileName, pdfFile);
    if (uploadError) {
      console.error(uploadError);
      setUploadingPdf(false);
      return;
    }
    const { data: urlData } = supabase.storage
      .from("clarity-files")
      .getPublicUrl(fileName);
    const fileUrl = urlData.publicUrl;
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
    if (error) console.error(error);
    else if (data) setNotes((prev) => [...prev, data]);
    setPdfFile(null);
    setUploadingPdf(false);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 rounded-b-xl shadow-md flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Folder className="w-6 h-6" /> {folder?.name || "Folder"}
        </h1>
        <Button className="" size="sm" onClick={() => router.push("/")}>
          ← Back
        </Button>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {isOwner && (
          <>
            {/* Subfolder creation */}
            <div className="bg-white shadow rounded-xl p-4 flex gap-3 items-center">
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="New subfolder..."
                className="flex-1"
              />
              <label className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                />
                Public
              </label>
              <Button onClick={createSubfolder} disabled={loading}>
                <FolderPlus className="w-4 h-4 mr-1" />{" "}
                {loading ? "Creating..." : "Create"}
              </Button>
            </div>

            {/* Notes creation */}
            <div className="bg-white shadow rounded-xl p-4 flex flex-col gap-3">
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
            <div className="bg-white shadow rounded-xl p-4 flex flex-col gap-3">
              <h2 className="font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5" /> Upload PDF
              </h2>
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

        {/* Subfolders */}
        {subfolders.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3">📂 Subfolders</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {subfolders.map((f) => (
                <Card
                  key={f.id}
                  className="cursor-pointer hover:shadow-lg transition rounded-xl"
                  onClick={() => router.push(`/folders/${f.id}`)}
                >
                  <CardContent className="flex justify-between items-center p-4">
                    <div className="flex items-center gap-2">
                      <Folder className="w-5 h-5 text-indigo-600" />
                      <p className="font-medium">{f.name}</p>
                    </div>
                    {f.is_public && (
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                        Public
                      </span>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="grid sm:grid-cols-1 gap-4">
          {notes.map((note) => (
            <Card
              key={note.id}
              className="cursor-pointer hover:shadow-lg transition rounded-xl"
              onClick={() => router.push(`/notes/${note.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="font-medium">{note.title}</p>
                  {note.is_public && (
                    <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                      Public
                    </span>
                  )}
                </div>
                {note.file_url ? (
                  <a
                    href={note.file_url}
                    target="_blank"
                    className="text-blue-600 underline"
                  >
                    View PDF
                  </a>
                ) : (
                  <div
                    className="text-gray-700 prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: note.content }}
                  />
                )}
              </CardContent>
            </Card>
          ))}
          {notes.length === 0 && (
            <p className="text-center text-gray-500 mt-6">No notes found.</p>
          )}
        </div>
      </div>
    </main>
  );
}
