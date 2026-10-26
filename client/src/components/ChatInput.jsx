import React, { useRef, useEffect } from 'react';
import { Send, Square, Sparkles } from 'lucide-react';

export function ChatInput({
  input,
  setInput,
  onSend,
  onStop,
  isStreaming,
  currentTone,
}) {
  const textareaRef = useRef(null);

  // Auto-resize textarea based on input content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isStreaming) {
        onSend();
      }
    }
  };

  return (
    <div className="chat-input-area">
      <div className="input-box-wrapper">
        <div className="input-top-bar">
          <div className="active-tone-chip">
            <Sparkles size={12} color="#6366f1" />
            <span>Active Tone:</span>
            <span
              style={{
                color:
                  currentTone === 'Professional'
                    ? '#a5b4fc'
                    : currentTone === 'Casual'
                    ? '#6ee7b7'
                    : '#fcd34d',
                fontWeight: 700,
              }}
            >
              {currentTone}
            </span>
          </div>
          {input.length > 0 && (
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
              {input.length} chars
            </span>
          )}
        </div>

        <textarea
          ref={textareaRef}
          className="chat-textarea"
          placeholder={`Ask anything in ${currentTone} tone... (Press Enter to send, Shift+Enter for new line)`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={isStreaming}
          id="chat-textarea"
          aria-label="Chat input text"
        />

        <div className="input-bottom-bar">
          <div className="input-hints">
            <span>Enter ↵ to send</span>
          </div>

          <div className="input-actions">
            {isStreaming ? (
              <button
                className="btn-stop"
                onClick={onStop}
                type="button"
                id="btn-stop-generating"
                title="Stop streaming response"
              >
                <Square size={13} fill="currentColor" />
                <span>Stop</span>
              </button>
            ) : (
              <button
                className="btn-send"
                onClick={onSend}
                disabled={!input.trim()}
                type="button"
                id="btn-send-message"
                title="Send message"
                aria-label="Send message"
              >
                <Send size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
