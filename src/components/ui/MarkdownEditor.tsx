import React, { useEffect, useMemo } from 'react';
import { type Editor, EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { marked } from 'marked';
import TurndownService from 'turndown';
import {
  Bold, Italic, Strikethrough, List, ListOrdered, Heading1, Heading2, Heading3, Underline as UnderlineIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Main Component
interface MarkdownEditorProps {
  value: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
}

export function MarkdownEditor({ value, onChange, placeholder }: MarkdownEditorProps) {
  const turndownService = useMemo(() => new TurndownService(), []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
      }),
      Underline,
      Placeholder.configure({ placeholder: placeholder ?? 'Start writing...' }),
    ],
    content: marked(value),
    onUpdate: ({ editor }) => {
      onChange(turndownService.turndown(editor.getHTML()));
    },
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert min-h-[400px] w-full max-w-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      },
    },
  });

  useEffect(() => {
    if (editor && !editor.isFocused) {
      const editorHtml = editor.getHTML();
      const valueHtml = marked(value);
      if (editorHtml !== valueHtml) {
        editor.commands.setContent(valueHtml);
      }
    }
  }, [value, editor]);


  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}


// Toolbar Component
const Toolbar = ({ editor }: { editor: Editor }) => {
  return (
    <div className="flex items-center gap-1 rounded-md border bg-transparent p-1">
      <select
        className="mr-2 rounded border border-input bg-transparent px-2 py-1 text-sm font-medium"
        value={
            editor.isActive('heading', { level: 1 }) ? '1' :
            editor.isActive('heading', { level: 2 }) ? '2' :
            editor.isActive('heading', { level: 3 }) ? '3' : '0'
        }
        onChange={(e) => {
          const level = parseInt(e.target.value, 10);
          if (level === 0) {
            editor.chain().focus().setParagraph().run();
          } else {
            editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 }).run();
          }
        }}
      >
        <option value="0">Aa</option>
        <option value="1">H1</option>
        <option value="2">H2</option>
        <option value="3">H3</option>
      </select>
      
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        aria-label="Toggle bold"
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        aria-label="Toggle italic"
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive('underline')}
        aria-label="Toggle underline"
      >
        <UnderlineIcon className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        aria-label="Toggle strikethrough"
      >
        <Strikethrough className="h-4 w-4" />
      </ToolbarButton>
      
      <div className="mx-1 h-6 w-px bg-border" />
      
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        aria-label="Toggle bullet list"
      >
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        aria-label="Toggle ordered list"
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>
    </div>
  );
};


// Toolbar Button Component
interface ToolbarButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isActive?: boolean;
}

const ToolbarButton = ({ className, isActive, ...props }: ToolbarButtonProps) => (
  <button
    type="button"
    className={cn(
      'inline-flex items-center justify-center rounded-md p-2 text-sm font-medium ring-offset-background transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
      isActive && 'bg-accent text-accent-foreground',
      className
    )}
    {...props}
  />
); 