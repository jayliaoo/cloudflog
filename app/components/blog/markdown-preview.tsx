import { marked } from 'marked';

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

export default function MarkdownPreview({ content, className = '' }: MarkdownPreviewProps) {
  if (!content.trim()) {
    return (
      <div className={`text-muted-foreground italic ${className}`}>
        Markdown preview will appear here...
      </div>
    );
  }

  return (
    <div 
      className={`max-w-none ${className} markdown`}
      dangerouslySetInnerHTML={{ __html: marked.parse(content) }}
      style={{
        lineHeight: '1.6',
      }}
    />
  );
}