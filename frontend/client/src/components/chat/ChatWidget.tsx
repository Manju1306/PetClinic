import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { apiFetch } from '../../util';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const WELCOME: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hi there! 🐾 I'm your PetClinic Assistant. I can help you:\n\n" +
    '• **Find a vet** for your pet\'s needs\n' +
    '• **Book a visit** step by step\n' +
    '• **Check visit history** for your pets\n' +
    '• **Get advice** on when to see a vet\n\n' +
    'How can I help you today?',
};

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const sendMessage = useCallback(async (text: string) => {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
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
          messages: updatedMessages.map(m => ({
            role: m.role,
            content: m.content,
          })),
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

      setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;

        setMessages(prev =>
          prev.map(m => m.id === assistantId ? { ...m, content: fullText } : m)
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
      setError(err.message || 'Something went wrong');
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
    sendMessage(text);
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="chat-bubble-btn"
          aria-label="Open chat assistant"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className="chat-bubble-badge">AI</span>
        </button>
      )}

      {isOpen && (
        <div className="chat-panel">
          <div className="chat-header">
            <div className="chat-header-info">
              <span className="chat-header-icon">🐾</span>
              <div>
                <div className="chat-header-title">PetClinic Assistant</div>
                <div className="chat-header-subtitle">AI-powered help</div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="chat-close-btn"
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

          <div className="chat-messages">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`chat-msg ${msg.role === 'user' ? 'chat-msg-user' : 'chat-msg-assistant'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="chat-msg-avatar">🤖</div>
                )}
                <div
                  className={`chat-msg-bubble ${msg.role === 'user' ? 'chat-msg-bubble-user' : 'chat-msg-bubble-assistant'}`}
                >
                  <MessageContent content={msg.content} />
                </div>
              </div>
            ))}

            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="chat-msg chat-msg-assistant">
                <div className="chat-msg-avatar">🤖</div>
                <div className="chat-msg-bubble chat-msg-bubble-assistant">
                  <div className="chat-typing">
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="chat-error">
                {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="chat-input-form">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about vets, visits, or pet care..."
              className="chat-input"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="chat-send-btn"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function MessageContent({ content }: { content: string }) {
  if (!content) return null;
  const lines = content.split('\n');

  return (
    <div className="chat-content">
      {lines.map((line, i) => {
        if (!line.trim()) return <br key={i} />;

        const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-');
        const formatted = line.replace(
          /\*\*(.*?)\*\*/g,
          '<strong>$1</strong>'
        );

        if (isBullet) {
          return (
            <div key={i} className="chat-bullet" dangerouslySetInnerHTML={{ __html: formatted }} />
          );
        }
        return <p key={i} className="chat-paragraph" dangerouslySetInnerHTML={{ __html: formatted }} />;
      })}
    </div>
  );
}
