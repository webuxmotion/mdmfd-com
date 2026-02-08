'use client';

import { useRef, useEffect } from 'react';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

// Simple markdown to HTML converter
function parseMarkdown(text: string): string {
  if (!text) return '';

  const lines = text.split('\n');
  const result: string[] = [];

  let inCodeBlock = false;
  let codeContent: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Handle code blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        result.push(`<pre class="bg-[var(--surface-hover)] p-3 rounded my-1 overflow-x-auto text-sm"><code>${codeContent.join('\n')}</code></pre>`);
        codeContent = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeContent.push(line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
      continue;
    }

    // Escape HTML for non-code content
    line = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Skip empty lines
    if (line.trim() === '') {
      continue;
    }

    // Headers
    if (line.startsWith('### ')) {
      result.push(`<h3 class="text-base font-bold">${line.slice(4)}</h3>`);
      continue;
    }
    if (line.startsWith('## ')) {
      result.push(`<h2 class="text-lg font-bold">${line.slice(3)}</h2>`);
      continue;
    }
    if (line.startsWith('# ')) {
      result.push(`<h1 class="text-xl font-bold">${line.slice(2)}</h1>`);
      continue;
    }

    // Horizontal rule
    if (line === '---') {
      result.push('<hr class="my-2 border-[var(--border-color)]" />');
      continue;
    }

    // Blockquotes
    if (line.startsWith('&gt; ')) {
      result.push(`<blockquote class="border-l-4 border-[var(--border-color)] pl-4 text-[var(--text-muted)]">${line.slice(5)}</blockquote>`);
      continue;
    }

    // Lists
    if (line.match(/^[-*] /)) {
      result.push(`<li class="ml-6 list-disc">${processInline(line.slice(2))}</li>`);
      continue;
    }
    if (line.match(/^\d+\. /)) {
      const match = line.match(/^\d+\. (.+)$/);
      if (match) {
        result.push(`<li class="ml-6 list-decimal">${processInline(match[1])}</li>`);
        continue;
      }
    }

    // Regular paragraph
    result.push(`<p>${processInline(line)}</p>`);
  }

  return result.join('');
}

// Process inline formatting
function processInline(text: string): string {
  let result = text;

  // Inline code
  result = result.replace(/`([^`]+)`/g, '<code class="bg-[var(--surface-hover)] px-1 rounded text-sm">$1</code>');

  // Bold
  result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Italic
  result = result.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Strikethrough
  result = result.replace(/~~(.+?)~~/g, '<del>$1</del>');

  // Links
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>');

  return result;
}

export default function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.max(300, textarea.scrollHeight) + 'px';
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [value]);

  const insertFormat = (prefix: string, suffix: string = prefix) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText = value.substring(0, start) + prefix + selectedText + suffix + value.substring(end);

    onChange(newText);

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const insertLine = (prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const newText = value.substring(0, lineStart) + prefix + value.substring(lineStart);

    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length);
    }, 0);
  };

  const ToolbarButton = ({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="p-2 hover:bg-[var(--surface-hover)] rounded transition-colors text-[var(--text-muted)]"
    >
      {children}
    </button>
  );

  return (
    <div className="mt-8">
      <div className="flex gap-4">
        {/* Editor */}
        <div className="flex-1 border border-[var(--border-color)] rounded-lg overflow-hidden bg-[var(--surface)]">
          {/* Toolbar */}
          <div className="flex items-center gap-1 p-2 border-b border-[var(--border-color)] bg-[var(--surface-hover)] flex-wrap">
            <ToolbarButton onClick={() => insertLine('# ')} title="Heading 1">
              <span className="font-bold text-sm">H</span>
            </ToolbarButton>
            <ToolbarButton onClick={() => insertFormat('**')} title="Bold">
              <span className="font-bold">B</span>
            </ToolbarButton>
            <ToolbarButton onClick={() => insertFormat('*')} title="Italic">
              <span className="italic">I</span>
            </ToolbarButton>
            <ToolbarButton onClick={() => insertFormat('~~')} title="Strikethrough">
              <span className="line-through">S</span>
            </ToolbarButton>
            <span className="w-px h-6 bg-[var(--border-color)] mx-1" />
            <ToolbarButton onClick={() => insertFormat('`')} title="Inline Code">
              <span className="font-mono text-sm">&lt;/&gt;</span>
            </ToolbarButton>
            <ToolbarButton onClick={() => insertFormat('\n```\n', '\n```\n')} title="Code Block">
              <span className="font-mono text-xs">CB</span>
            </ToolbarButton>
            <span className="w-px h-6 bg-[var(--border-color)] mx-1" />
            <ToolbarButton onClick={() => insertLine('- ')} title="Bullet List">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="9" y1="6" x2="20" y2="6" />
                <line x1="9" y1="12" x2="20" y2="12" />
                <line x1="9" y1="18" x2="20" y2="18" />
                <circle cx="4" cy="6" r="1.5" fill="currentColor" />
                <circle cx="4" cy="12" r="1.5" fill="currentColor" />
                <circle cx="4" cy="18" r="1.5" fill="currentColor" />
              </svg>
            </ToolbarButton>
            <ToolbarButton onClick={() => insertLine('1. ')} title="Numbered List">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="10" y1="6" x2="20" y2="6" />
                <line x1="10" y1="12" x2="20" y2="12" />
                <line x1="10" y1="18" x2="20" y2="18" />
                <text x="2" y="8" fontSize="8" fill="currentColor" stroke="none">1</text>
                <text x="2" y="14" fontSize="8" fill="currentColor" stroke="none">2</text>
                <text x="2" y="20" fontSize="8" fill="currentColor" stroke="none">3</text>
              </svg>
            </ToolbarButton>
            <span className="w-px h-6 bg-[var(--border-color)] mx-1" />
            <ToolbarButton onClick={() => insertLine('> ')} title="Quote">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
              </svg>
            </ToolbarButton>
            <ToolbarButton onClick={() => insertFormat('[', '](url)')} title="Link">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </ToolbarButton>
            <ToolbarButton onClick={() => insertLine('---\n')} title="Horizontal Rule">
              <span className="text-lg leading-none">—</span>
            </ToolbarButton>
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Write your README here using Markdown..."
            className="w-full min-h-[300px] p-4 resize-none focus:outline-none font-mono text-sm bg-[var(--input-bg)] text-[var(--foreground)] placeholder-[var(--text-muted)]"
          />
        </div>

        {/* Preview */}
        <div className="flex-1 border border-[var(--border-color)] rounded-lg overflow-hidden bg-[var(--surface)]">
          <div className="p-2 border-b border-[var(--border-color)] bg-[var(--surface-hover)]">
            <span className="text-[var(--text-muted)] text-sm font-medium">Preview</span>
          </div>
          <div
            className="p-4 min-h-[300px] overflow-y-auto prose prose-sm max-w-none text-[var(--foreground)]"
            dangerouslySetInnerHTML={{ __html: parseMarkdown(value) }}
          />
        </div>
      </div>
    </div>
  );
}
