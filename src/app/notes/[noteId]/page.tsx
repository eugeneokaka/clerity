"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Note = {
  id: string;
  folder_id: string;
  user_id: string;
  title: string;
  content: string | null;
  file_url: string | null;
  is_public: boolean;
  created_at: string;
};

export default function NotePage() {
  const router = useRouter();
  const params = useParams();
  const noteId = params?.noteId as string;

  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  // AI state
  const [aiInput, setAiInput] = useState("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    const fetchNote = async () => {
      if (!noteId) return;

      setLoading(true);
      setError(null);

      try {
        // Get current user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError) throw userError;

        const currentUserId = user?.id || null;
        setUserId(currentUserId);

        // Fetch note either owned by user OR public
        const { data, error } = await supabase
          .from("notes")
          .select("*")
          .or(
            currentUserId
              ? `and(id.eq.${noteId},user_id.eq.${currentUserId}),and(id.eq.${noteId},is_public.eq.true)`
              : `and(id.eq.${noteId},is_public.eq.true)`
          )
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          setError("Note not found or access denied.");
        } else {
          setNote(data);
          setTitle(data.title);
          setContent(data.content || "");
        }
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchNote();
  }, [noteId]);

  // Save changes
  const handleSave = async () => {
    if (!note) return;

    try {
      const { error } = await supabase
        .from("notes")
        .update({ title, content })
        .eq("id", note.id)
        .eq("user_id", userId); // ownership check

      if (error) throw error;

      setNote({ ...note, title, content });
      setIsEditing(false);
    } catch (err: any) {
      alert("Failed to save: " + err.message);
    }
  };

  // AI request
  const handleAskAI = async () => {
    if (!aiInput.trim()) return;
    setAiLoading(true);
    setAiResponse(null);

    try {
      const resp = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiInput }),
      });

      const data = await resp.json();
      setAiResponse(data.text || "No response.");
    } catch (err: any) {
      setAiResponse("Error: " + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return <p className="p-6">Loading note...</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;
  if (!note) return <p className="p-6">Note not found.</p>;

  const isOwner = userId === note.user_id;

  return (
    <main className="p-6 max-w-3xl mx-auto">
      {/* Note Title */}
      <div className="flex justify-between items-center mb-4">
        {isEditing ? (
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-xl font-bold"
          />
        ) : (
          <h1 className="text-2xl font-bold">{note.title}</h1>
        )}

        <Button variant="outline" size="sm" onClick={() => router.back()}>
          ← Back
        </Button>
      </div>

      {/* Note Visibility */}
      {note.is_public && (
        <span className="inline-block mb-4 px-2 py-1 bg-green-100 text-green-800 rounded">
          Public
        </span>
      )}

      {/* Note Content */}
      {isEditing ? (
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={10}
          className="mb-4"
        />
      ) : (
        <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
      )}

      {/* Attached File */}
      {note.file_url && !isEditing && (
        <a
          href={note.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline block mt-2"
        >
          Open attached file
        </a>
      )}

      <p className="mt-4 text-sm text-gray-500">
        Created at: {new Date(note.created_at).toLocaleString()}
      </p>

      {/* Edit Controls */}
      {isOwner && (
        <div className="mt-6 flex gap-2">
          {isEditing ? (
            <>
              <Button onClick={handleSave}>Save</Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>Edit</Button>
          )}
        </div>
      )}

      {/* AI Input Section */}
      <div className="mt-10 p-4 border rounded-lg shadow-sm bg-gray-50">
        <h2 className="text-lg font-semibold mb-2">Ask AI about anything</h2>
        <Textarea
          value={aiInput}
          onChange={(e) => setAiInput(e.target.value)}
          placeholder="Paste text or ask a question..."
          rows={4}
          className="mb-3"
        />
        <Button onClick={handleAskAI} disabled={aiLoading}>
          {aiLoading ? "Thinking..." : "Ask AI"}
        </Button>

        {aiResponse && (
          <div className="mt-4 p-3 bg-white border rounded">
            <h3 className="font-medium mb-1">AI Response:</h3>
            <p className="whitespace-pre-wrap">{aiResponse}</p>
          </div>
        )}
      </div>
    </main>
  );
}
