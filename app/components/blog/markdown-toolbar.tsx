import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import {
  Bold,
  Italic,
  Link,
  List,
  ListOrdered,
  Code,
  Quote,
  Table,
  Heading1,
  Heading2,
  Heading3,
  Image,
  Strikethrough,
  CheckSquare,
  Minus,
} from "lucide-react";
import ImageDialog from "./image-dialog";

interface MarkdownToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  content: string;
  setContent: (content: string) => void;
}

export default function MarkdownToolbar({ textareaRef, content, setContent }: MarkdownToolbarProps) {
  const [imageDialogOpen, setImageDialogOpen] = useState(false);

  const insertText = (before: string, after: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const newText = textarea.value.substring(0, start) + before + selectedText + after + textarea.value.substring(end);
    
    setContent(newText);
    
    // Set cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const insertTable = () => {
    const tableMarkdown = `
| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Row 2    | Data     | More     |
`;
    insertText(tableMarkdown.trim());
  };

  const insertCodeBlock = () => {
    const codeMarkdown = "```javascript\n// Your code here\nconsole.log('Hello, world!');\n```";
    insertText(codeMarkdown);
  };



  const handleImageInsert = (url: string, altText: string) => {
    insertText(`![${altText}](${url})`);
  };

  const insertLink = () => {
    const linkMarkdown = "[Link text](url)";
    insertText(linkMarkdown, "");
  };

  return (
    <div className="flex flex-wrap gap-1 p-2 bg-muted border-b border-input rounded-t-md">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertText("**", "**")}
          title="Bold"
          className="h-8 w-8 p-0"
        >
        <Bold className="h-4 w-4" />
      </Button>
      
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => insertText("*", "*")}
        title="Italic"
        className="h-8 w-8 p-0"
      >
        <Italic className="h-4 w-4" />
      </Button>
      
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => insertText("~~", "~~")}
        title="Strikethrough"
        className="h-8 w-8 p-0"
      >
        <Strikethrough className="h-4 w-4" />
      </Button>
      
      <div className="w-px bg-border mx-1" />
      
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => insertText("# ", "")}
        title="Heading 1"
        className="h-8 w-8 p-0"
      >
        <Heading1 className="h-4 w-4" />
      </Button>
      
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => insertText("## ", "")}
        title="Heading 2"
        className="h-8 w-8 p-0"
      >
        <Heading2 className="h-4 w-4" />
      </Button>
      
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => insertText("### ", "")}
        title="Heading 3"
        className="h-8 w-8 p-0"
      >
        <Heading3 className="h-4 w-4" />
      </Button>
      
      <div className="w-px bg-border mx-1" />
      
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={insertLink}
        title="Link"
        className="h-8 w-8 p-0"
      >
        <Link className="h-4 w-4" />
      </Button>
      
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setImageDialogOpen(true)}
        title="Image"
        className="h-8 w-8 p-0"
      >
        <Image className="h-4 w-4" />
      </Button>
      
      <ImageDialog
        open={imageDialogOpen}
        onOpenChange={setImageDialogOpen}
        onImageInsert={handleImageInsert}
      />
      
      <div className="w-px bg-border mx-1" />
      
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => insertText("- ", "")}
        title="Unordered List"
        className="h-8 w-8 p-0"
      >
        <List className="h-4 w-4" />
      </Button>
      
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => insertText("1. ", "")}
        title="Ordered List"
        className="h-8 w-8 p-0"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
      
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => insertText("- [ ] ", "")}
        title="Task List"
        className="h-8 w-8 p-0"
      >
        <CheckSquare className="h-4 w-4" />
      </Button>
      
      <div className="w-px bg-border mx-1" />
      
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={insertCodeBlock}
        title="Code Block"
        className="h-8 w-8 p-0"
      >
        <Code className="h-4 w-4" />
      </Button>
      
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => insertText("`", "`")}
        title="Inline Code"
        className="h-8 w-8 p-0"
      >
        <span className="text-xs font-mono">&lt;/&gt;</span>
      </Button>
      
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => insertText("> ", "")}
        title="Blockquote"
        className="h-8 w-8 p-0"
      >
        <Quote className="h-4 w-4" />
      </Button>
      
      <div className="w-px bg-border mx-1" />
      
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={insertTable}
        title="Table"
        className="h-8 w-8 p-0"
      >
        <Table className="h-4 w-4" />
      </Button>
      
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => insertText("\n---\n", "")}
        title="Horizontal Rule"
        className="h-8 w-8 p-0"
      >
        <Minus className="h-4 w-4" />
      </Button>
    </div>
  );
}