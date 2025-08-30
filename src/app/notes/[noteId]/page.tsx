"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";

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
  console.log("Note ID from params:", noteId);

  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNote = async () => {
      if (!noteId) return;

      setLoading(true);
      setError(null);

      try {
        // Get current user
        console.log("Fetching current user...");
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;

        const userId = user?.id || null;
        console.log("Current user ID:", userId);

        // Fetch note either owned by user OR public
        const { data, error } = await supabase
          .from("notes")
          .select("*")
          .or(
            userId
              ? `and(id.eq.${noteId},user_id.eq.${userId}),and(id.eq.${noteId},is_public.eq.true)`
              : `and(id.eq.${noteId},is_public.eq.true)`
          )
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          setError("Note not found or access denied.");
        } else {
          setNote(data);
        }
      } catch (err: any) {
        console.error("Fetch note failed:", err);
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchNote();
  }, [noteId]);

  if (loading) return <p className="p-6">Loading notes...</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;
  if (!note) return <p className="p-6">Note not found.</p>;

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">{note.title}</h1>
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          ← Back
        </Button>
      </div>

      {note.is_public && (
        <span className="inline-block mb-4 px-2 py-1 bg-green-100 text-green-800 rounded">
          Public
        </span>
      )}

      {note.content && (
        <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
      )}

      {note.file_url && (
        <a
          href={note.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline"
        >
          Open attached file
        </a>
      )}

      <p className="mt-4 text-sm text-gray-500">
        Created at: {new Date(note.created_at).toLocaleString()}
      </p>
    </main>
  );
}
