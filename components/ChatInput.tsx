import React, { useState, useRef, useEffect } from 'react';
import { Send, StopCircle } from 'lucide-react';
import { Button } from './ui/Button';

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop: () => void;
  isLoading: boolean;
  disabled: boolean;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onStop,
  isLoading,
  disabled,
  placeholder = 'Type a message...'
}) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading && !disabled) {
      onSend(input.trim());
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [input]);

  return (
    <div className="p-4 bg-zinc-900 border-t border-zinc-800">
      <div className="max-w-4xl mx-auto relative">
        <form
          onSubmit={handleSubmit}
          className="relative flex items-end gap-2 bg-zinc-800/50 p-2 rounded-xl border border-zinc-700/50 focus-within:border-blue-500/50 focus-within:bg-zinc-800 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all"
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled || isLoading}
            placeholder={disabled ? 'Please load a model first...' : placeholder}
            className="w-full bg-transparent text-zinc-100 placeholder-zinc-500 resize-none focus:outline-none py-2 px-2 min-h-[44px] max-h-[120px] custom-scrollbar text-sm sm:text-base disabled:opacity-50"
            rows={1}
          />
          <div className="flex-shrink-0 pb-1 pr-1">
            <Button
              type={isLoading ? 'button' : 'submit'}
              size="sm"
              variant={isLoading ? 'danger' : 'primary'}
              disabled={(!input.trim() && !isLoading) || disabled}
              className={
                isLoading ? '' : 'rounded-lg w-10 h-10 p-0 flex items-center justify-center'
              }
              onClick={isLoading ? onStop : undefined}
            >
              {isLoading ? (
                <span className="flex items-center gap-2 px-1">
                  <StopCircle size={16} /> <span className="hidden sm:inline">Stop</span>
                </span>
              ) : (
                <Send size={18} />
              )}
            </Button>
          </div>
        </form>
        <div className="text-center mt-2">
          <p className="text-[10px] text-zinc-500">AI can make mistakes. Check important info.</p>
        </div>
      </div>
    </div>
  );
};
