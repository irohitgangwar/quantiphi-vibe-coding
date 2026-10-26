import React, { useState } from 'react';
import { Bot, User, Copy, Check } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';

export function MessageItem({ message, isStreaming = false }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const formatTime = (ts) => {
    if (!ts) return '';
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`message-row ${isUser ? 'user' : 'ai'}`}>
      <div className={`avatar ${isUser ? 'user-avatar' : 'ai-avatar'}`}>
        {isUser ? <User size={18} /> : <Bot size={18} />}
      </div>

      <div className="message-content-wrapper">
        <div className="message-meta">
          <span>{isUser ? 'You' : 'AI Assistant'}</span>
          <span>•</span>
          <span>{formatTime(message.timestamp || Date.now())}</span>
          {message.tone && (
            <>
              <span>•</span>
              <span className={`tone-badge ${message.tone}`}>
                {message.tone}
              </span>
            </>
          )}
        </div>

        <div className={`message-bubble ${isUser ? 'user-bubble' : 'ai-bubble'}`}>
          {isUser ? (
            <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>
          ) : (
            <>
              <MarkdownRenderer content={message.content} />
              {isStreaming && <span className="streaming-cursor" />}
            </>
          )}
        </div>

        {!isUser && !isStreaming && message.content && (
          <div className="message-actions-bar">
            <button
              className="btn-icon-sm"
              onClick={handleCopyMessage}
              title="Copy message text"
              aria-label="Copy entire message"
            >
              {copied ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
              <span style={{ fontSize: '0.7rem', marginLeft: '4px' }}>
                {copied ? 'Copied' : 'Copy'}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
