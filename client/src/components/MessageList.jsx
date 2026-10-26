import React, { useEffect, useRef } from 'react';
import { Sparkles, Terminal, Code2, Coffee, Zap } from 'lucide-react';
import { MessageItem } from './MessageItem';

export function MessageList({
  messages = [],
  isStreaming = false,
  streamingContent = '',
  currentTone = 'Professional',
  onSelectPromptSuggestion,
}) {
  const bottomRef = useRef(null);

  const suggestions = [
    {
      icon: Terminal,
      category: 'System Design',
      prompt: 'Explain microservices vs monolith architecture with key trade-offs and best practices.',
    },
    {
      icon: Code2,
      category: 'Frontend Engineering',
      prompt: 'Write a robust React custom hook for managing Server-Sent Events with reconnection logic.',
    },
    {
      icon: Coffee,
      category: 'Explain Like I\'m 5',
      prompt: 'Explain how Large Language Models predict next tokens in simple everyday terms.',
    },
    {
      icon: Zap,
      category: 'Quick Reference',
      prompt: 'Provide a concise checklist for securing production Node.js and Express REST APIs.',
    },
  ];

  // Auto-scroll to bottom on new message or stream chunk
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const isEmpty = messages.length === 0 && !streamingContent;

  if (isEmpty) {
    return (
      <div className="messages-container">
        <div className="empty-state">
          <div className="empty-icon">
            <Sparkles size={32} />
          </div>
          <h2>What would you like to build or explore?</h2>
          <p>
            Experience intelligent, real-time streaming conversations. Switch between{' '}
            <strong style={{ color: '#a5b4fc' }}>Professional</strong>,{' '}
            <strong style={{ color: '#6ee7b7' }}>Casual</strong>, or{' '}
            <strong style={{ color: '#fcd34d' }}>Concise</strong> tones anytime to adjust the response style on the fly.
          </p>

          <div className="prompt-suggestions">
            {suggestions.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="suggestion-card"
                  onClick={() => onSelectPromptSuggestion(item.prompt)}
                  id={`suggestion-card-${idx}`}
                >
                  <div className="suggestion-tag">
                    <Icon size={12} />
                    <span>{item.category}</span>
                  </div>
                  <div className="suggestion-text">{item.prompt}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="messages-container" id="messages-container">
      {messages.map((msg, index) => (
        <MessageItem key={msg._id || index} message={msg} />
      ))}

      {/* Streaming View: Real-time rendering of in-flight AI response */}
      {isStreaming && streamingContent && (
        <MessageItem
          message={{
            role: 'assistant',
            content: streamingContent,
            timestamp: new Date().toISOString(),
            tone: currentTone,
          }}
          isStreaming={true}
        />
      )}

      <div ref={bottomRef} style={{ height: '1px' }} />
    </div>
  );
}
