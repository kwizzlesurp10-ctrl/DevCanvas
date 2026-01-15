'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase, getAnonymousUserId, getUserDisplayName } from '@/lib/supabaseClient';
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
import { Send, Pencil, Trash2, X, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { Message } from '@/types/database';

interface ChatProps {
  roomId: string;
}

export default function Chat({ roomId }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const { currentChannelId, userId, userName } = useAppStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentChannelId) {
      setMessages([]);
      return;
    }

    // Set loading state before clearing messages
    setIsLoading(true);
    setMessages([]);

    // Load initial messages
    const loadMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('channel_id', currentChannelId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        setIsLoading(false);
        return;
      }

      if (data) {
        setMessages(data);
        setIsLoading(false);
      }
    };

    loadMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`room:${roomId}:messages:${currentChannelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${currentChannelId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setMessages((prev) => [...prev, payload.new as Message]);
          } else if (payload.eventType === 'UPDATE') {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === payload.new.id ? (payload.new as Message) : msg
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setMessages((prev) => prev.filter((msg) => msg.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
      // Don't clear messages here - let the next effect handle it
      // This prevents race conditions and message flashing
    };
  }, [currentChannelId, roomId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !currentChannelId || isSending) return;

    setIsSending(true);
    const messageContent = input.trim();
    setInput('');

    try {
      const { error } = await supabase.from('messages').insert({
        channel_id: currentChannelId,
        content: messageContent,
        author_id: userId || getAnonymousUserId(),
        author_name: userName || getUserDisplayName(),
      });

      if (error) throw error;
      toast.success('Message sent');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      setInput(messageContent); // Restore input on error
    } finally {
      setIsSending(false);
    }
  };

  const handleEdit = (message: Message) => {
    setEditingMessageId(message.id);
    setEditContent(message.content);
  };

  const handleSaveEdit = async (messageId: string) => {
    if (!editContent.trim()) return;

    try {
      const { error } = await supabase
        .from('messages')
        .update({ content: editContent.trim() })
        .eq('id', messageId);

      if (error) throw error;
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
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageToDelete);

      if (error) throw error;
      toast.success('Message deleted');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    } finally {
      // Always close dialog and clear state, regardless of success or failure
      setDeleteDialogOpen(false);
      setMessageToDelete(null);
    }
  };

  if (!currentChannelId) {
    return (
      <div className="h-full w-full border-l border-border bg-card p-4 text-center text-muted-foreground">
        Select a channel to start chatting
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col border-l border-border bg-card">
      <div className="border-b border-border p-4">
        <h3 className="font-semibold">Chat</h3>
      </div>
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {isLoading ? (
          <div className="flex items-center justify-center p-4 text-muted-foreground">
            Loading messages...
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isOwnMessage = message.author_id === (userId || getAnonymousUserId());
              const isEditing = editingMessageId === message.id;

              return (
                <div key={message.id} className="group space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium">
                      {message.author_name || 'Anonymous'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(message.created_at).toLocaleTimeString()}
                    </span>
                    {isOwnMessage && !isEditing && (
                      <div className="ml-auto flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
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
                      </div>
                    )}
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
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>
      <div className="border-t border-border p-4">
        <div className="flex gap-2">
          <Input
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
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
