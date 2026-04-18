'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { getAnonymousUserId } from '@/lib/supabaseClient';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Send, Pencil, Trash2, X, Check, MessageCircle, Smile, ArrowLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { Message, Reaction } from '@/types/database';
import { useMessageHandling } from './hooks/useMessageHandling';
import { useReactions } from './hooks/useReactions';

const EMOJI_OPTIONS = ['👍', '👎', '❤️', '😂', '🎉', '🤔', '👀', '🔥', '✅', '❌', '🚀', '💯'];

interface ChatProps {
  roomId: string;
}

// Markdown renderer shared across message views
function MessageContent({ content }: { content: string }) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown
        components={{
          code(props) {
            const { className, children, ...rest } = props;
            const match = /language-(\w+)/.exec(className || '');
            const inline = !match;
            return !inline && match ? (
              <SyntaxHighlighter
                language={match[1]}
                style={oneDark}
                PreTag="div"
                customStyle={{
                  margin: 0,
                  borderRadius: '0.5rem',
                  padding: '1rem',
                }}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...rest}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

// Reactions bar displayed below each message
function ReactionBar({
  messageId,
  messageReactions,
  currentUserId,
  onToggle,
}: {
  messageId: string;
  messageReactions: Reaction[];
  currentUserId: string;
  onToggle: (messageId: string, emoji: string) => Promise<void>;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close picker on outside click
  useEffect(() => {
    if (!pickerOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [pickerOpen]);

  // Group reactions by emoji
  const grouped = useMemo(() => {
    const map = new Map<string, { count: number; userReacted: boolean }>();
    for (const r of messageReactions) {
      const entry = map.get(r.emoji) || { count: 0, userReacted: false };
      entry.count++;
      if (r.author_id === currentUserId) entry.userReacted = true;
      map.set(r.emoji, entry);
    }
    return map;
  }, [messageReactions, currentUserId]);

  const handleToggle = async (emoji: string) => {
    try {
      await onToggle(messageId, emoji);
    } catch {
      toast.error('Failed to update reaction');
    }
    setPickerOpen(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-1 mt-1">
      {Array.from(grouped.entries()).map(([emoji, { count, userReacted }]) => (
        <button
          key={emoji}
          onClick={() => handleToggle(emoji)}
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors hover:bg-accent ${
            userReacted ? 'border-primary bg-primary/10' : 'border-border'
          }`}
          title={userReacted ? 'Remove reaction' : 'Add reaction'}
        >
          <span>{emoji}</span>
          <span>{count}</span>
        </button>
      ))}
      <div className="relative" ref={pickerRef}>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setPickerOpen((prev) => !prev)}
          title="Add reaction"
        >
          <Smile className="h-3 w-3" />
        </Button>
        {pickerOpen && (
          <div className="absolute bottom-full left-0 z-50 mb-1 grid grid-cols-6 gap-1 rounded-lg border border-border bg-popover p-2 shadow-md">
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleToggle(emoji)}
                className="rounded p-1 text-base hover:bg-accent"
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Chat({ roomId }: ChatProps) {
  const [input, setInput] = useState('');
  const [threadInput, setThreadInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isThreadSending, setIsThreadSending] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const { currentChannelId, userId, userName } = useAppStore();

  const {
    messages,
    isLoading,
    sendMessage,
    editMessage,
    deleteMessage,
    replyCounts,
    threadParentId,
    threadMessages,
    threadLoading,
    openThread,
    closeThread,
  } = useMessageHandling(roomId, currentChannelId);

  const currentUserId = userId || getAnonymousUserId();

  // Collect all message IDs (main + thread) for reaction loading
  const allMessageIds = useMemo(() => {
    const ids = messages.map((m) => m.id);
    for (const tm of threadMessages) {
      if (!ids.includes(tm.id)) ids.push(tm.id);
    }
    if (threadParentId && !ids.includes(threadParentId)) ids.push(threadParentId);
    return ids;
  }, [messages, threadMessages, threadParentId]);

  const { reactions, toggleReaction } = useReactions(currentChannelId, allMessageIds);

  // Find parent message for the thread panel
  const threadParentMessage = useMemo(
    () => messages.find((m) => m.id === threadParentId) ?? null,
    [messages, threadParentId]
  );

  // Main message send
  const handleSend = async () => {
    if (!input.trim() || !currentChannelId || isSending) return;

    setIsSending(true);
    const messageContent = input.trim();
    setInput('');

    try {
      await sendMessage(messageContent, userId, userName);
      toast.success('Message sent');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      setInput(messageContent);
    } finally {
      setIsSending(false);
    }
  };

  // Thread reply send
  const handleThreadSend = async () => {
    if (!threadInput.trim() || !threadParentId || !currentChannelId || isThreadSending) return;

    setIsThreadSending(true);
    const messageContent = threadInput.trim();
    setThreadInput('');

    try {
      await sendMessage(messageContent, userId, userName, threadParentId);
      toast.success('Reply sent');
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Failed to send reply');
      setThreadInput(messageContent);
    } finally {
      setIsThreadSending(false);
    }
  };

  const handleEdit = (message: Message) => {
    setEditingMessageId(message.id);
    setEditContent(message.content);
  };

  const handleSaveEdit = async (messageId: string) => {
    if (!editContent.trim()) return;

    try {
      await editMessage(messageId, editContent);
      setEditingMessageId(null);
      setEditContent('');
      toast.success('Message updated');
    } catch (error) {
      console.error('Error updating message:', error);
      toast.error('Failed to update message');
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditContent('');
  };

  const handleDeleteClick = (messageId: string) => {
    setMessageToDelete(messageId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!messageToDelete) return;

    try {
      await deleteMessage(messageToDelete);
      toast.success('Message deleted');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    } finally {
      setDeleteDialogOpen(false);
      setMessageToDelete(null);
    }
  };

  // Renders a single message row with action buttons, reactions, and optional reply count
  const renderMessage = (message: Message, options?: { showReplyButton?: boolean }) => {
    const isOwnMessage = message.author_id === currentUserId;
    const isEditing = editingMessageId === message.id;
    const showReplyButton = options?.showReplyButton ?? false;
    const replyCount = replyCounts[message.id] || 0;
    const msgReactions = reactions[message.id] || [];

    return (
      <div key={message.id} className="group space-y-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium">
            {message.author_name || 'Anonymous'}
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date(message.created_at).toLocaleTimeString()}
          </span>
          <div className="ml-auto flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            {showReplyButton && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => openThread(message.id)}
                title="Reply in thread"
              >
                <MessageCircle className="h-3 w-3" />
              </Button>
            )}
            {isOwnMessage && !isEditing && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleEdit(message)}
                  title="Edit message"
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive hover:text-destructive"
                  onClick={() => handleDeleteClick(message.id)}
                  title="Delete message"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        </div>
        {isEditing ? (
          <div className="flex gap-2">
            <Input
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSaveEdit(message.id);
                } else if (e.key === 'Escape') {
                  handleCancelEdit();
                }
              }}
              className="flex-1"
              autoFocus
            />
            <Button
              size="icon"
              className="h-8 w-8"
              onClick={() => handleSaveEdit(message.id)}
              title="Save (Enter)"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleCancelEdit}
              title="Cancel (Esc)"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <MessageContent content={message.content} />
        )}

        {/* Reactions */}
        <ReactionBar
          messageId={message.id}
          messageReactions={msgReactions}
          currentUserId={currentUserId}
          onToggle={toggleReaction}
        />

        {/* Reply count indicator (only in main view) */}
        {showReplyButton && replyCount > 0 && (
          <button
            onClick={() => openThread(message.id)}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <MessageCircle className="h-3 w-3" />
            {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
          </button>
        )}
      </div>
    );
  };

  if (!currentChannelId) {
    return (
      <div className="h-full w-full border-l border-border bg-card p-4 text-center text-muted-foreground">
        Select a channel to start chatting
      </div>
    );
  }

  return (
    <div className="flex h-full w-full border-l border-border bg-card">
      {/* Main chat area */}
      <div className={`flex flex-1 flex-col ${threadParentId ? 'hidden md:flex' : ''}`}>
        <div className="border-b border-border p-4">
          <h3 className="font-semibold">Chat</h3>
        </div>
        <ScrollArea className="flex-1 p-4">
          {isLoading ? (
            <div className="flex items-center justify-center p-4 text-muted-foreground">
              Loading messages...
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => renderMessage(message, { showReplyButton: true }))}
            </div>
          )}
        </ScrollArea>
        <div className="border-t border-border p-4">
          <div className="flex gap-2">
            <Input
              id="chat-message-input"
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isSending}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Thread panel */}
      {threadParentId && (
        <div className="flex w-full flex-col border-l border-border md:w-80 lg:w-96" role="complementary" aria-label="Thread panel">
          <div className="flex items-center gap-2 border-b border-border p-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={closeThread}
              aria-label="Back to channel"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h3 className="font-semibold">Thread</h3>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto h-6 w-6"
              onClick={closeThread}
              aria-label="Close thread"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <ScrollArea className="flex-1 p-4">
            {/* Parent message */}
            {threadParentMessage && (
              <div className="mb-4 border-b border-border pb-4">
                {renderMessage(threadParentMessage)}
              </div>
            )}
            {/* Replies */}
            {threadLoading ? (
              <div className="flex items-center justify-center p-4 text-muted-foreground">
                Loading replies...
              </div>
            ) : threadMessages.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground">
                No replies yet. Start the conversation!
              </div>
            ) : (
              <div className="space-y-4">
                {threadMessages.map((msg) => renderMessage(msg))}
              </div>
            )}
          </ScrollArea>
          <div className="border-t border-border p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Reply in thread..."
                value={threadInput}
                onChange={(e) => setThreadInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleThreadSend();
                  }
                }}
              />
              <Button
                onClick={handleThreadSend}
                disabled={!threadInput.trim() || isThreadSending}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) {
            setMessageToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this message? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
