"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";

type PdfUploaderProps = {
  noteId: string;
  folderId: string; // used to check is_public
  onUploaded?: (url: string) => void;
};

export default function PdfUploader({
  noteId,
  folderId,
  onUploaded,
}: PdfUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true);
      const file = event.target.files?.[0];
      if (!file) return;

      // 1️⃣ Get folder info
      const { data: folder, error: folderError } = await supabase
        .from("folders")
        .select("is_public")
        .eq("id", folderId)
        .single();

      if (folderError) throw folderError;

      // 2️⃣ Get current user
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("Not logged in");

      // 3️⃣ Decide file path based on public/private
      const filePath = folder?.is_public
        ? `public/${noteId}-${Date.now()}-${file.name}`
        : `${userId}/${noteId}-${Date.now()}-${file.name}`;

      // 4️⃣ Upload file
      const { error: uploadError } = await supabase.storage
        .from("clarity-files")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      let finalUrl: string;

      if (folder?.is_public) {
        // 5️⃣ Public folders → simple public URL
        const { data } = supabase.storage
          .from("clarity-files")
          .getPublicUrl(filePath);
        finalUrl = data.publicUrl;
      } else {
        // 6️⃣ Private folders → signed URL
        const { data: signedData, error: signedError } = await supabase.storage
          .from("clarity-files")
          .createSignedUrl(filePath, 60 * 60); // 1 hr
        if (signedError) throw signedError;
        finalUrl = signedData.signedUrl;
      }

      // 7️⃣ Save URL to note
      const { error: dbError } = await supabase
        .from("notes")
        .update({ file_url: finalUrl })
        .eq("id", noteId);

      if (dbError) throw dbError;

      setFileUrl(finalUrl);
      if (onUploaded) onUploaded(finalUrl);
    } catch (err) {
      console.error("Error uploading PDF:", err);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <input
        type="file"
        accept="application/pdf"
        onChange={handleUpload}
        disabled={uploading}
      />
      {uploading && <p className="text-sm text-gray-500">Uploading...</p>}
      {fileUrl && (
        <div className="mt-2">
          <p className="text-sm">Uploaded PDF:</p>
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            View PDF
          </a>
        </div>
      )}
    </div>
  );
}
