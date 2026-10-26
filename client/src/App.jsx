import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatHeader } from './components/ChatHeader';
import { MessageList } from './components/MessageList';
import { ChatInput } from './components/ChatInput';
import {
  fetchHealth,
  fetchConversations,
  fetchConversation,
  updateConversation,
  deleteConversation,
  streamChatMessage,
} from './api';

export default function App() {
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [currentTitle, setCurrentTitle] = useState('New Chat');
  const [tone, setTone] = useState('Professional');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dbStatus, setDbStatus] = useState(null);
  const [aiProvider, setAiProvider] = useState(null);

  const abortControllerRef = useRef(null);

  // Initial load: health check and conversations list
  useEffect(() => {
    fetchHealth()
      .then((data) => {
        setDbStatus(data.database);
        setAiProvider(data.aiProvider);
      })
      .catch((err) => {
        console.warn('Backend health check error:', err);
        setDbStatus({ connected: false, type: 'Offline' });
      });

    loadConversations();
  }, []);

  // Fetch threads with optional search filter
  const loadConversations = useCallback(async (search = '') => {
    try {
      const list = await fetchConversations(search);
      setConversations(list);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  }, []);

  // Handle search filter change
  const handleSearchChange = (term) => {
    setSearchTerm(term);
    loadConversations(term);
  };

  // Select a conversation from sidebar
  const handleSelectConversation = async (id) => {
    if (isStreaming) {
      handleStopGenerating();
    }
    try {
      const data = await fetchConversation(id);
      setCurrentConversationId(data._id);
      setCurrentTitle(data.title || 'Untitled Chat');
      setTone(data.tone || 'Professional');
      setMessages(data.messages || []);
      setStreamingContent('');
    } catch (err) {
      console.error('Failed to fetch conversation:', err);
    }
  };

  // Start a fresh chat
  const handleNewChat = () => {
    if (isStreaming) {
      handleStopGenerating();
    }
    setCurrentConversationId(null);
    setCurrentTitle('New Chat');
    setMessages([]);
    setStreamingContent('');
    setInput('');
  };

  // Change Tone
  const handleToneChange = async (newTone) => {
    setTone(newTone);
    if (currentConversationId) {
      try {
        await updateConversation(currentConversationId, { tone: newTone });
      } catch (err) {
        console.warn('Failed to persist tone update:', err);
      }
    }
  };

  // Rename Conversation
  const handleRenameConversation = async (id, newTitle) => {
    try {
      await updateConversation(id, { title: newTitle });
      if (currentConversationId === id) {
        setCurrentTitle(newTitle);
      }
      loadConversations(searchTerm);
    } catch (err) {
      console.error('Failed to rename conversation:', err);
    }
  };

  // Delete Conversation
  const handleDeleteConversation = async (id) => {
    try {
      await deleteConversation(id);
      if (currentConversationId === id) {
        handleNewChat();
      }
      loadConversations(searchTerm);
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  // Clear current chat
  const handleClearChat = () => {
    if (isStreaming) {
      handleStopGenerating();
    }
    setMessages([]);
    setStreamingContent('');
  };

  // Stop in-flight stream
  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (streamingContent) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: streamingContent + ' *(Response stopped by user)*',
          timestamp: new Date().toISOString(),
          tone,
        },
      ]);
    }
    setIsStreaming(false);
    setStreamingContent('');
  };

  // Send message and initiate streaming
  const handleSendMessage = async (customPrompt) => {
    const textToSend = (customPrompt || input).trim();
    if (!textToSend || isStreaming) return;

    setInput('');

    // Optimistic user message in UI
    const tempUserMsg = {
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString(),
      tone,
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    setIsStreaming(true);
    setStreamingContent('');

    const controller = new AbortController();
    abortControllerRef.current = controller;

    let targetConvId = currentConversationId;
    let accumulatedContent = '';

    await streamChatMessage({
      conversationId: currentConversationId,
      prompt: textToSend,
      tone,
      signal: controller.signal,
      onStart: (data) => {
        if (!currentConversationId && data.conversationId) {
          targetConvId = data.conversationId;
          setCurrentConversationId(data.conversationId);
          setCurrentTitle(textToSend.slice(0, 36) + (textToSend.length > 36 ? '...' : ''));
        }
      },
      onToken: (token) => {
        accumulatedContent += token;
        setStreamingContent((prev) => prev + token);
      },
      onDone: (data) => {
        setIsStreaming(false);
        setStreamingContent('');
        abortControllerRef.current = null;

        if (data.assistantMessage) {
          setMessages((prev) => [...prev, data.assistantMessage]);
        } else if (accumulatedContent) {
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: accumulatedContent,
              timestamp: new Date().toISOString(),
              tone,
            },
          ]);
        }

        // Refresh thread list in sidebar to reflect latest message & auto-generated title
        loadConversations(searchTerm);
      },
      onError: (err) => {
        console.error('Streaming error encountered:', err);
        setIsStreaming(false);
        abortControllerRef.current = null;
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `⚠️ **Error:** ${err.message || 'Unable to complete streaming response.'}`,
            timestamp: new Date().toISOString(),
            tone,
          },
        ]);
        setStreamingContent('');
      },
    });
  };

  // Extra Feature 2: Export chat transcript to Markdown or JSON file
  const handleExportChat = (format = 'markdown') => {
    if (messages.length === 0) {
      alert('No messages to export in the current conversation.');
      return;
    }

    const safeTitle = (currentTitle || 'chat_transcript')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .toLowerCase();

    let fileContent = '';
    let fileName = '';
    let mimeType = '';

    if (format === 'markdown') {
      fileName = `${safeTitle}.md`;
      mimeType = 'text/markdown;charset=utf-8;';
      fileContent = `# Conversation: ${currentTitle}\n\n`;
      fileContent += `*Exported on: ${new Date().toLocaleString()}*\n`;
      fileContent += `*Tone Mode: ${tone}*\n\n---\n\n`;

      messages.forEach((m) => {
        const sender = m.role === 'user' ? '👤 **User**' : '🤖 **AI Assistant**';
        const time = m.timestamp ? new Date(m.timestamp).toLocaleTimeString() : '';
        fileContent += `### ${sender} (${time}) [Tone: ${m.tone || tone}]\n\n`;
        fileContent += `${m.content}\n\n---\n\n`;
      });
    } else {
      fileName = `${safeTitle}.json`;
      mimeType = 'application/json;charset=utf-8;';
      fileContent = JSON.stringify(
        {
          title: currentTitle,
          tone,
          exportedAt: new Date().toISOString(),
          messages,
        },
        null,
        2
      );
    }

    const blob = new Blob([fileContent], { type: mimeType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation & Thread History */}
      <Sidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        dbStatus={dbStatus}
        aiProvider={aiProvider}
        isOpen={sidebarOpen}
        onCloseMobile={() => setSidebarOpen(false)}
      />

      {/* Main Chat Workspace */}
      <main className="main-chat">
        <ChatHeader
          currentTitle={currentTitle}
          tone={tone}
          onToneChange={handleToneChange}
          onExport={handleExportChat}
          onClearChat={handleClearChat}
          onToggleMobileSidebar={() => setSidebarOpen((prev) => !prev)}
        />

        <MessageList
          messages={messages}
          isStreaming={isStreaming}
          streamingContent={streamingContent}
          currentTone={tone}
          onSelectPromptSuggestion={(prompt) => handleSendMessage(prompt)}
        />

        <ChatInput
          input={input}
          setInput={setInput}
          onSend={() => handleSendMessage()}
          onStop={handleStopGenerating}
          isStreaming={isStreaming}
          currentTone={tone}
        />
      </main>
    </div>
  );
}
