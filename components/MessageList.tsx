import React, { useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Message } from '../types';
import { Bot, User, Copy } from 'lucide-react';

interface MessageListProps {
  messages: Message[];
  isStreaming: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, isStreaming }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      const btn = document.getElementById(`copy-btn-${id}`);
      if (btn) {
        btn.classList.add('text-green-500');
        setTimeout(() => btn.classList.remove('text-green-500'), 2000);
      }
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-4">
          <div className="p-4 bg-zinc-900 rounded-full border border-zinc-800">
            <Bot size={48} className="text-blue-500" />
          </div>
          <h2 className="text-xl font-semibold text-zinc-300">Ready to Chat Locally</h2>
          <p className="max-w-md text-center text-sm">
            Select a model from the sidebar to begin. All processing happens securely on your
            device. No data is sent to any server.
          </p>
        </div>
      )}

      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          {msg.role === 'assistant' && (
            <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center shrink-0 border border-blue-600/30">
              <Bot size={16} className="text-blue-400" />
            </div>
          )}

          <div
            className={`relative group max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-3.5 ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white rounded-br-none'
                : 'bg-zinc-800/80 text-zinc-100 rounded-bl-none border border-zinc-700/50'
            }`}
          >
            <div className="markdown-body text-sm leading-relaxed break-words">
              {msg.role === 'user' ? (
                <p>{msg.content}</p>
              ) : (
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              )}
            </div>

            {msg.role === 'assistant' && (
              <button
                id={`copy-btn-${msg.id}`}
                onClick={() => copyToClipboard(msg.content, msg.id)}
                className="absolute -bottom-6 left-0 text-zinc-500 hover:text-zinc-300 transition-colors p-1 opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs"
                title="Copy to clipboard"
              >
                <Copy size={12} /> Copy
              </button>
            )}
          </div>

          {msg.role === 'user' && (
            <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center shrink-0 border border-zinc-600">
              <User size={16} className="text-zinc-300" />
            </div>
          )}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
};
