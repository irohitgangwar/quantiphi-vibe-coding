import React, { useState } from 'react';
import {
  Menu,
  Briefcase,
  Smile,
  Zap,
  Download,
  Trash,
  Check,
  ChevronDown,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export function ChatHeader({
  currentTitle = 'New Chat',
  tone = 'Professional',
  onToneChange,
  onExport,
  onClearChat,
  onToggleMobileSidebar,
}) {
  const [showExportMenu, setShowExportMenu] = useState(false);

  const tones = [
    { id: 'Professional', label: 'Professional', icon: Briefcase, desc: 'Structured, formal, analytical' },
    { id: 'Casual', label: 'Casual', icon: Smile, desc: 'Friendly, witty, conversational' },
    { id: 'Concise', label: 'Concise', icon: Zap, desc: 'Ultra-direct, punchy, zero fluff' },
  ];

  const handleExport = (format) => {
    setShowExportMenu(false);
    onExport(format);
    try {
      confetti({ particleCount: 30, spread: 60, origin: { y: 0.1, x: 0.8 } });
    } catch {
      // safe fallback
    }
  };

  return (
    <header className="chat-header">
      <div className="header-left">
        <button
          className="mobile-toggle"
          onClick={onToggleMobileSidebar}
          aria-label="Open sidebar"
          id="btn-mobile-sidebar"
        >
          <Menu size={22} />
        </button>

        <div className="chat-title-container">
          <div className="chat-current-title" title={currentTitle}>
            <span>{currentTitle}</span>
          </div>
        </div>
      </div>

      <div className="header-right">
        {/* The Vibe Check - Tone Toggle */}
        <div className="tone-selector-wrap" title="Tone Toggle: Modifies AI system instruction dynamically">
          {tones.map((t) => {
            const Icon = t.icon;
            const isActive = tone === t.id;
            return (
              <button
                key={t.id}
                className={`tone-btn ${isActive ? `active ${t.id}` : ''}`}
                onClick={() => onToneChange(t.id)}
                title={`${t.label} Tone: ${t.desc}`}
                id={`tone-btn-${t.id.toLowerCase()}`}
              >
                <Icon size={14} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Extra Feature: Export Chat & Clear */}
        <div className="header-actions" style={{ position: 'relative' }}>
          <button
            className="btn-header-action"
            onClick={() => setShowExportMenu(!showExportMenu)}
            title="Export conversation history"
            id="btn-export-chat"
          >
            <Download size={14} />
            <span>Export</span>
            <ChevronDown size={12} />
          </button>

          {showExportMenu && (
            <div
              style={{
                position: 'absolute',
                top: '110%',
                right: 0,
                background: '#131c2e',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                padding: '0.4rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.2rem',
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                zIndex: 100,
                minWidth: '160px',
              }}
            >
              <button
                className="btn-header-action"
                style={{ justifyContent: 'flex-start', border: 'none', width: '100%' }}
                onClick={() => handleExport('markdown')}
              >
                <span>Export as Markdown (.md)</span>
              </button>
              <button
                className="btn-header-action"
                style={{ justifyContent: 'flex-start', border: 'none', width: '100%' }}
                onClick={() => handleExport('json')}
              >
                <span>Export as JSON (.json)</span>
              </button>
            </div>
          )}

          <button
            className="btn-header-action"
            onClick={onClearChat}
            title="Reset and clear current chat view"
            id="btn-clear-chat"
          >
            <Trash size={14} />
            <span>Clear</span>
          </button>
        </div>
      </div>
    </header>
  );
}
