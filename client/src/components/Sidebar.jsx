import React, { useState } from 'react';
import {
  MessageSquare,
  Plus,
  Search,
  Trash2,
  Edit2,
  Check,
  X,
  Sparkles,
  Database,
  Radio,
  Cpu,
} from 'lucide-react';

export function Sidebar({
  conversations = [],
  currentConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
  searchTerm,
  onSearchChange,
  dbStatus,
  aiProvider,
  isOpen,
  onCloseMobile,
}) {
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  const handleStartRename = (e, conv) => {
    e.stopPropagation();
    setEditingId(conv._id);
    setEditTitle(conv.title);
  };

  const handleSaveRename = (e, id) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleCancelRename = (e) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      onDeleteConversation(id);
    }
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="brand">
          <div className="brand-info">
            <div className="brand-logo">
              <Sparkles size={20} />
            </div>
            <div>
              <h1 className="brand-title">AI Chat Assistant</h1>
              <p className="brand-subtitle">Real-Time Intelligent Studio</p>
            </div>
          </div>
          {isOpen && (
            <button
              className="btn-icon-sm mobile-toggle"
              onClick={onCloseMobile}
              aria-label="Close sidebar"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <button
          className="btn-new-chat"
          onClick={() => {
            onNewChat();
            if (isOpen) onCloseMobile();
          }}
          id="btn-new-chat"
        >
          <Plus size={18} />
          <span>New Chat</span>
        </button>

        {/* Search filter in History Sidebar (Extra Feature) */}
        <div className="sidebar-search">
          <Search size={14} className="search-icon" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            id="sidebar-search-input"
          />
        </div>
      </div>

      <div className="sidebar-history">
        <div className="history-section-title">
          Recent Threads ({conversations.length})
        </div>

        {conversations.length === 0 ? (
          <div style={{ padding: '1.5rem 0.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
            {searchTerm ? 'No matching conversations' : 'No conversation history yet. Start a new chat!'}
          </div>
        ) : (
          conversations.map((conv) => {
            const isActive = conv._id === currentConversationId;
            const isEditing = editingId === conv._id;

            return (
              <div
                key={conv._id}
                className={`thread-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  onSelectConversation(conv._id);
                  if (isOpen) onCloseMobile();
                }}
                id={`thread-item-${conv._id}`}
              >
                <div className="thread-info">
                  <MessageSquare size={15} style={{ opacity: isActive ? 1 : 0.6, flexShrink: 0 }} />
                  {isEditing ? (
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveRename(e, conv._id);
                        if (e.key === 'Escape') handleCancelRename(e);
                      }}
                      autoFocus
                      style={{
                        background: 'rgba(0,0,0,0.5)',
                        border: '1px solid #6366f1',
                        color: '#fff',
                        padding: '0.15rem 0.4rem',
                        fontSize: '0.82rem',
                        borderRadius: '4px',
                        width: '100%',
                      }}
                    />
                  ) : (
                    <span className="thread-title" title={conv.title}>
                      {conv.title || 'Untitled Thread'}
                    </span>
                  )}
                </div>

                <div className="thread-actions">
                  {isEditing ? (
                    <>
                      <button
                        className="btn-icon-sm"
                        onClick={(e) => handleSaveRename(e, conv._id)}
                        title="Save title"
                      >
                        <Check size={14} color="#10b981" />
                      </button>
                      <button
                        className="btn-icon-sm"
                        onClick={handleCancelRename}
                        title="Cancel"
                      >
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="btn-icon-sm"
                        onClick={(e) => handleStartRename(e, conv)}
                        title="Rename conversation"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        className="btn-icon-sm delete"
                        onClick={(e) => handleDelete(e, conv._id)}
                        title="Delete conversation"
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="sidebar-footer">
        <div className="status-pill">
          <Database size={13} />
          <span>Database:</span>
          <span style={{ fontWeight: 600, color: dbStatus?.connected ? '#10b981' : '#f59e0b' }}>
            {dbStatus?.type || 'Connecting...'}
          </span>
          <span className={`status-indicator ${dbStatus?.connected ? '' : 'fallback'}`} />
        </div>
        <div className="status-pill">
          <Cpu size={13} />
          <span>AI Engine:</span>
          <span style={{ fontWeight: 600, color: aiProvider?.hasOpenAIKey ? '#10b981' : '#a5b4fc' }}>
            {aiProvider?.hasOpenAIKey ? `OpenAI (${aiProvider.model})` : 'Contextual Simulator'}
          </span>
        </div>
        <div className="status-pill" style={{ fontSize: '0.7rem', color: '#64748b' }}>
          <Radio size={12} />
          <span>Real-time SSE Streaming Active</span>
        </div>
      </div>
    </aside>
  );
}
