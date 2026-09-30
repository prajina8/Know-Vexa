import { useParams, Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Send, Trash2, Bot, User as UserIcon, BookOpenCheck, HelpCircle } from 'lucide-react';
import { aiService, materialService } from '../services';
import { useToast } from '../context/ToastContext';
import { apiErrorMessage } from '../api/client';
import { Spinner, useConfirm } from '../components/Feedback';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  usedContext?: boolean;
  createdAt?: string;
}

const SUGGESTED = [
  'What are the most important points?',
  'Explain this topic simply, like I\'m new to it',
  'Give me a real-world example',
  'Create a practice question from this material',
];

export default function ChatPage() {
  const { materialId } = useParams<{ materialId: string }>();
  const [input, setInput] = useState('');
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { confirm, dialog } = useConfirm();
  const queryClient = useQueryClient();

  const { data: material } = useQuery({
    queryKey: ['material', materialId],
    queryFn: () => materialService.get(materialId!),
    enabled: !!materialId,
  });

  const { data: history } = useQuery({
    queryKey: ['chatHistory', materialId],
    queryFn: () => aiService.chatHistory(materialId!),
    enabled: !!materialId,
  });

  useEffect(() => {
    if (history) setLocalMessages(history as ChatMessage[]);
  }, [history]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages]);

  const sendMutation = useMutation({
    mutationFn: (message: string) => aiService.chat(materialId!, message),
    onMutate: (message) => {
      setLocalMessages((m) => [...m, { role: 'user', content: message }]);
      setInput('');
    },
    onSuccess: (result) => {
      setLocalMessages((m) => [...m, { role: 'assistant', content: result.answer, usedContext: result.usedContext }]);
    },
    onError: (err) => {
      toast(apiErrorMessage(err), 'error');
      setLocalMessages((m) => m.slice(0, -1)); // remove the optimistic user message on failure
    },
  });

  const clearMutation = useMutation({
    mutationFn: () => aiService.clearChat(materialId!),
    onSuccess: () => {
      setLocalMessages([]);
      queryClient.invalidateQueries({ queryKey: ['chatHistory', materialId] });
      toast('Chat cleared', 'success');
    },
  });

  const handleSend = (text: string) => {
    if (!text.trim() || sendMutation.isPending) return;
    sendMutation.mutate(text.trim());
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-6rem)] max-w-3xl flex-col">
      {dialog}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <Link to={`/app/materials/${materialId}`} className="inline-flex items-center gap-1 text-sm text-terracotta-500 hover:text-terracotta-600">
            <ArrowLeft size={14} /> Back
          </Link>
          <h1 className="font-display mt-1 text-xl font-bold">{material?.title || 'Study Chat'}</h1>
        </div>
        <button
          onClick={async () => {
            if (await confirm('Clear chat?', 'This will delete the conversation history for this material.', true)) {
              clearMutation.mutate();
            }
          }}
          className="btn-ghost"
        >
          <Trash2 size={16} /> Clear
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto rounded-2xl border border-terracotta-200 bg-ivory p-4 dark:border-terracotta-800 dark:bg-terracotta-900">
        {localMessages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <Bot className="text-terracotta-300" size={32} />
            <p className="max-w-sm text-sm text-terracotta-500 dark:text-terracotta-400">
              Ask anything about this document — I'll answer from its content, and tell you clearly if
              something isn't covered.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTED.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="flex items-center gap-1.5 rounded-full border border-terracotta-200 px-3 py-1.5 text-xs font-medium hover:border-terracotta-300 hover:text-terracotta-600 dark:border-terracotta-700"
                >
                  <HelpCircle size={12} /> {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {localMessages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                m.role === 'user' ? 'bg-terracotta-200 dark:bg-terracotta-700' : 'bg-terracotta-100 dark:bg-terracotta-900'
              }`}
            >
              {m.role === 'user' ? <UserIcon size={15} /> : <Bot size={15} className="text-terracotta-600 dark:text-terracotta-300" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
              m.role === 'user'
                ? 'bg-terracotta-600 text-ivory'
                : 'bg-terracotta-100 text-terracotta-800 dark:bg-terracotta-800 dark:text-terracotta-100'
            }`}>
              {m.role === 'assistant' ? (
                <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1.5">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              ) : (
                m.content
              )}
              {m.role === 'assistant' && m.usedContext !== undefined && (
                <p className="mt-1.5 flex items-center gap-1 text-[11px] opacity-60">
                  <BookOpenCheck size={11} />
                  {m.usedContext ? 'Answered from your document' : 'Not found in your document'}
                </p>
              )}
            </div>
          </div>
        ))}

        {sendMutation.isPending && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-terracotta-100 dark:bg-terracotta-900">
              <Bot size={15} className="text-terracotta-600 dark:text-terracotta-300" />
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-terracotta-100 px-4 py-2.5 text-sm dark:bg-terracotta-800">
              <Spinner size={14} /> Thinking…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
        className="mt-3 flex gap-2"
      >
        <input
          className="input"
          placeholder="Ask about this material…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" disabled={sendMutation.isPending || !input.trim()} className="btn-primary !px-4">
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
