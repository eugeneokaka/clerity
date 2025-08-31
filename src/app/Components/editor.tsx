"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Button } from "@/components/ui/button";

export default function RichTextEditor({
  content,
  onChange,
}: {
  content: string;
  onChange: (value: string) => void;
}) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    immediatelyRender: false,
    autofocus: true, // 👈 focus cursor when editor mounts
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  return (
    <div className="border rounded-lg p-2">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 mb-2">
        <Button
          type="button"
          variant={editor.isActive("bold") ? "default" : "outline"}
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          Bold
        </Button>
        <Button
          type="button"
          variant={editor.isActive("italic") ? "default" : "outline"}
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          Italic
        </Button>
        <Button
          type="button"
          variant={editor.isActive("bulletList") ? "default" : "outline"}
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          List
        </Button>
      </div>

      {/* Editor */}
      <EditorContent
        editor={editor}
        className="min-h-[150px] prose max-w-none focus:outline-none p-2 rounded-md bg-white dark:bg-neutral-900"
      />
    </div>
  );
}
