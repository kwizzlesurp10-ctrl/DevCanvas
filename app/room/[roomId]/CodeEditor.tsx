'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  Plus,
  Trash2,
  Copy,
  Check,
  Eye,
  Pencil,
  Code2,
  ChevronDown,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/lib/constants';
import { useCodeEditor } from './hooks/useCodeEditor';

interface CodeEditorProps {
  roomId: string;
}

export default function CodeEditor({ roomId }: CodeEditorProps) {
  const {
    snippets,
    activeSnippetId,
    activeSnippet,
    setActiveSnippetId,
    createSnippet,
    updateSnippet,
    deleteSnippet,
    editingUsers,
    broadcastPresence,
  } = useCodeEditor(roomId);

  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [copied, setCopied] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newLanguage, setNewLanguage] = useState<SupportedLanguage>('javascript');
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  // Close lang dropdown on outside click
  useEffect(() => {
    if (!showLangDropdown) return;
    const handler = (e: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) {
        setShowLangDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showLangDropdown]);

  const handleCopy = useCallback(async () => {
    if (!activeSnippet) return;
    try {
      await navigator.clipboard.writeText(activeSnippet.content);
      setCopied(true);
      toast.success('Code copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  }, [activeSnippet]);

  const handleCreate = useCallback(() => {
    const title = newTitle.trim() || 'Untitled';
    createSnippet(title, newLanguage);
    setNewTitle('');
    setNewLanguage('javascript');
    setShowNewForm(false);
    setMode('edit');
  }, [newTitle, newLanguage, createSnippet]);

  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (activeSnippetId) {
        updateSnippet(activeSnippetId, e.target.value);
      }
    },
    [activeSnippetId, updateSnippet]
  );

  // Broadcast presence on blur
  const handleEditorBlur = useCallback(() => {
    broadcastPresence(null);
  }, [broadcastPresence]);

  const handleEditorFocus = useCallback(() => {
    if (activeSnippetId) {
      broadcastPresence(activeSnippetId);
    }
  }, [activeSnippetId, broadcastPresence]);

  // Line numbers for the editor
  const lineCount = (activeSnippet?.content || '').split('\n').length;

  // Other users editing the active snippet
  const activeEditors = Array.from(editingUsers.entries())
    .filter(([, info]) => info.snippet_id === activeSnippetId)
    .map(([, info]) => info.user_name);

  return (
    <div className="flex h-full flex-col bg-card">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <Code2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-semibold">Code Editor</span>
        <div className="ml-auto flex items-center gap-1">
          {activeSnippet && (
            <>
              {/* Language selector */}
              <div className="relative" ref={langDropdownRef}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={() => setShowLangDropdown((p) => !p)}
                >
                  {activeSnippet.language}
                  <ChevronDown className="h-3 w-3" />
                </Button>
                {showLangDropdown && (
                  <div className="absolute right-0 top-full z-50 mt-1 max-h-48 w-36 overflow-y-auto rounded-md border border-border bg-popover shadow-lg">
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <button
                        key={lang}
                        onClick={() => {
                          if (activeSnippetId && activeSnippet) {
                            // We need to update the snippet language via a direct state update
                            // For now, the language is set at creation time
                          }
                          setShowLangDropdown(false);
                        }}
                        className={`w-full px-3 py-1.5 text-left text-xs hover:bg-accent ${
                          lang === activeSnippet.language ? 'bg-accent font-medium' : ''
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Mode toggle */}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={() => setMode((m) => (m === 'edit' ? 'preview' : 'edit'))}
                title={mode === 'edit' ? 'Switch to preview' : 'Switch to edit'}
              >
                {mode === 'edit' ? <Eye className="h-3 w-3" /> : <Pencil className="h-3 w-3" />}
                {mode === 'edit' ? 'Preview' : 'Edit'}
              </Button>

              {/* Copy */}
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy} title="Copy code">
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </Button>

              {/* Delete */}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => {
                  if (activeSnippetId) deleteSnippet(activeSnippetId);
                }}
                title="Delete snippet"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </>
          )}

          {/* New snippet */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setShowNewForm((p) => !p)}
            title="New snippet"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* New snippet form */}
      {showNewForm && (
        <div className="flex items-center gap-2 border-b border-border px-3 py-2 animate-fade-in">
          <input
            type="text"
            placeholder="Snippet title..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate();
              if (e.key === 'Escape') setShowNewForm(false);
            }}
            className="h-7 flex-1 rounded border border-border bg-background px-2 text-xs outline-none focus:ring-1 focus:ring-ring"
            autoFocus
          />
          <select
            value={newLanguage}
            onChange={(e) => setNewLanguage(e.target.value as SupportedLanguage)}
            className="h-7 rounded border border-border bg-background px-1 text-xs outline-none"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
          <Button variant="default" size="sm" className="h-7 text-xs" onClick={handleCreate}>
            Create
          </Button>
        </div>
      )}

      {/* Snippet tabs */}
      {snippets.length > 0 && (
        <div className="flex gap-0 overflow-x-auto border-b border-border bg-muted/30">
          {snippets.map((snippet) => (
            <button
              key={snippet.id}
              onClick={() => {
                setActiveSnippetId(snippet.id);
                setMode('edit');
              }}
              className={`min-w-0 shrink-0 border-b-2 px-3 py-1.5 text-xs transition-colors ${
                snippet.id === activeSnippetId
                  ? 'border-primary bg-card text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              title={snippet.title}
            >
              <span className="block max-w-[120px] truncate">{snippet.title}</span>
            </button>
          ))}
        </div>
      )}

      {/* Active editors indicator */}
      {activeEditors.length > 0 && (
        <div className="flex items-center gap-1 border-b border-border bg-primary/5 px-3 py-1 text-xs text-muted-foreground">
          <Users className="h-3 w-3" />
          {activeEditors.join(', ')} editing...
        </div>
      )}

      {/* Editor / Preview area */}
      <div className="flex-1 overflow-hidden">
        {!activeSnippet ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
            <Code2 className="h-10 w-10 opacity-30" />
            <p className="text-sm">No snippets yet</p>
            <Button variant="outline" size="sm" onClick={() => setShowNewForm(true)}>
              <Plus className="mr-1 h-3 w-3" /> Create Snippet
            </Button>
          </div>
        ) : mode === 'edit' ? (
          <div className="flex h-full overflow-auto">
            {/* Line numbers */}
            <div
              className="select-none bg-muted/30 px-2 py-3 text-right font-mono text-xs leading-5 text-muted-foreground"
              aria-hidden="true"
            >
              {Array.from({ length: Math.max(lineCount, 1) }, (_, i) => (
                <div key={i + 1}>{i + 1}</div>
              ))}
            </div>
            {/* Textarea editor */}
            <textarea
              ref={textareaRef}
              value={activeSnippet.content}
              onChange={handleContentChange}
              onFocus={handleEditorFocus}
              onBlur={handleEditorBlur}
              className="flex-1 resize-none bg-background p-3 font-mono text-sm leading-5 outline-none"
              spellCheck={false}
              placeholder="Start typing code..."
            />
          </div>
        ) : (
          <div className="h-full overflow-auto p-3">
            {activeSnippet.content ? (
              <SyntaxHighlighter
                language={activeSnippet.language}
                style={oneDark}
                showLineNumbers
                customStyle={{
                  margin: 0,
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                }}
              >
                {activeSnippet.content}
              </SyntaxHighlighter>
            ) : (
              <p className="text-sm text-muted-foreground italic">Nothing to preview</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
