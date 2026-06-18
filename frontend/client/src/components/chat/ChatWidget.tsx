import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { apiFetch } from '../../util';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const WELCOME: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hello! I'm your PetClinic Assistant. Here's what I can help with:\n\n" +
    '• **Find a vet** — search by specialty or name\n' +
    '• **Book a visit** — schedule appointments for your pets\n' +
    '• **View visit history** — check past and upcoming visits\n' +
    '• **Explore specialties** — see what care is available\n\n' +
    'What would you like to do?',
  timestamp: new Date(),
};

const SUGGESTIONS = [
  'Show my pets',
  'Find a vet for dental care',
  'Book a visit',
];

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  const adjustTextareaHeight = () => {
    const ta = inputRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 100) + 'px';
    }
  };

  const sendMessage = useCallback(async (text: string) => {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);
    setError(null);

    const assistantId = `assistant-${Date.now()}`;

    try {
      const res = await apiFetch('api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages
            .filter(m => m.id !== 'welcome')
            .map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(errText || `Server error: ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let fullText = '';

      setMessages(prev => [
        ...prev,
        { id: assistantId, role: 'assistant', content: '', timestamp: new Date() },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        setMessages(prev =>
          prev.map(m => (m.id === assistantId ? { ...m, content: fullText } : m)),
        );
      }

      if (!fullText.trim()) {
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId
              ? { ...m, content: 'Sorry, I could not generate a response. Please try again.' }
              : m,
          ),
        );
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  if (!isAuthenticated) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
    sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSuggestion = (text: string) => {
    if (isLoading) return;
    sendMessage(text);
  };

  const clearChat = () => {
    setMessages([WELCOME]);
    setError(null);
  };

  const showSuggestions = messages.length === 1 && messages[0].id === 'welcome';

  return (
    <>
      {/* Floating bubble button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-spring-green text-white shadow-lg transition-transform hover:scale-105 hover:shadow-xl cursor-pointer"
          aria-label="Open chat assistant"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex w-[400px] h-[580px] flex-col overflow-hidden rounded-2xl bg-gray-50 shadow-2xl animate-[slideUp_0.25s_ease-out] max-[480px]:w-[calc(100vw-16px)] max-[480px]:h-[calc(100vh-80px)] max-[480px]:bottom-2 max-[480px]:right-2">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 bg-spring-green text-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div>
                <div className="text-[15px] font-bold tracking-tight font-display">PetClinic Assistant</div>
                <div className="flex items-center gap-1.5 text-[11px] opacity-85">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-200" />
                  Online
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                className="flex items-center justify-center rounded-md p-1.5 opacity-70 transition hover:bg-white/15 hover:opacity-100 cursor-pointer"
                aria-label="Clear chat"
                title="Clear chat"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                </svg>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center rounded-md p-1.5 opacity-70 transition hover:bg-white/15 hover:opacity-100 cursor-pointer"
                aria-label="Close chat"
                title="Close chat"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto p-4 bg-gray-50 [scrollbar-width:thin]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 max-w-[88%] ${msg.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-spring-green text-white">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                )}
                <div
                  className={`rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed break-words ${
                    msg.role === 'user'
                      ? 'bg-spring-green text-white rounded-br-sm'
                      : 'bg-white text-spring-brown border border-gray-200 rounded-bl-sm shadow-sm'
                  }`}
                >
                  <MessageContent content={msg.content} isUser={msg.role === 'user'} />
                  <div className={`mt-1 text-[10px] opacity-50 ${msg.role === 'user' ? 'text-right' : ''}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex gap-2 self-start">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-spring-green text-white">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <div className="rounded-2xl rounded-bl-sm border border-gray-200 bg-white px-3.5 py-2.5 shadow-sm">
                  <div className="flex gap-1.5 py-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mx-1 flex items-center justify-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-600">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions */}
          {showSuggestions && (
            <div className="flex flex-wrap gap-2 px-4 pt-2 pb-1 shrink-0 bg-gray-50">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSuggestion(s)}
                  className="rounded-full border border-gray-300 bg-white px-3.5 py-1.5 text-xs text-spring-brown whitespace-nowrap transition hover:border-spring-green hover:text-spring-green cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input form */}
          <form onSubmit={handleSubmit} className="flex items-end gap-2 border-t border-gray-200 bg-white px-4 py-3 shrink-0">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                adjustTextareaHeight();
              }}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="flex-1 resize-none rounded-2xl border border-gray-300 bg-gray-50 px-3.5 py-2.5 text-sm text-spring-brown leading-snug outline-none transition-colors focus:border-spring-green focus:ring-2 focus:ring-spring-green/15 placeholder:text-gray-400"
              disabled={isLoading}
              rows={1}
              style={{ maxHeight: 100 }}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-spring-green text-white transition hover:bg-spring-dark-green hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              aria-label="Send message"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function MessageContent({ content, isUser }: { content: string; isUser: boolean }) {
  if (!content) return null;
  const lines = content.split('\n');

  return (
    <div>
      {lines.map((line, i) => {
        if (!line.trim()) return <br key={i} />;

        const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-');
        const formatted = line.replace(/\*\*(.*?)\*\*/g, (_, m) =>
          `<strong class="${isUser ? 'font-bold' : 'font-bold text-spring-dark-green'}">${m}</strong>`
        );

        if (isBullet) {
          return <div key={i} className="pl-2 my-0.5" dangerouslySetInnerHTML={{ __html: formatted }} />;
        }
        return <p key={i} className="mb-1 last:mb-0" dangerouslySetInnerHTML={{ __html: formatted }} />;
      })}
    </div>
  );
}
