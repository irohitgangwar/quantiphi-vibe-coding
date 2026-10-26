import { conversationRepo } from '../models/Conversation.js';
import { streamChatCompletion } from '../services/aiService.js';
import { isDbConnected } from '../db.js';

export const chatController = {
  // GET /api/health
  async getHealth(req, res) {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: {
        connected: isDbConnected(),
        type: isDbConnected() ? 'MongoDB' : 'In-Memory Resilient Store',
      },
      aiProvider: {
        hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.startsWith('sk-placeholder')),
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      },
    });
  },

  // GET /api/conversations
  async listConversations(req, res) {
    try {
      const search = req.query.search || '';
      const conversations = await conversationRepo.list(search);
      
      const formatted = conversations.map((c) => ({
        _id: c._id,
        title: c.title,
        tone: c.tone || 'Professional',
        updatedAt: c.updatedAt,
        createdAt: c.createdAt,
        messageCount: c.messages ? c.messages.length : 0,
        lastMessage: c.messages && c.messages.length > 0 ? c.messages[c.messages.length - 1].content.slice(0, 80) : '',
      }));

      res.json({ success: true, count: formatted.length, data: formatted });
    } catch (err) {
      console.error('[listConversations Error]', err);
      res.status(500).json({ success: false, error: 'Failed to retrieve conversations' });
    }
  },

  // POST /api/conversations
  async createConversation(req, res) {
    try {
      const { title, tone } = req.body;
      const conversation = await conversationRepo.create({
        title: title || 'New Conversation',
        tone: tone || 'Professional',
        messages: [],
      });
      res.status(201).json({ success: true, data: conversation });
    } catch (err) {
      console.error('[createConversation Error]', err);
      res.status(500).json({ success: false, error: 'Failed to create conversation' });
    }
  },

  // GET /api/conversations/:id
  async getConversation(req, res) {
    try {
      const { id } = req.params;
      const conversation = await conversationRepo.getById(id);
      if (!conversation) {
        return res.status(404).json({ success: false, error: 'Conversation not found' });
      }
      res.json({ success: true, data: conversation });
    } catch (err) {
      console.error('[getConversation Error]', err);
      res.status(500).json({ success: false, error: 'Failed to retrieve conversation' });
    }
  },

  // PATCH /api/conversations/:id
  async updateConversation(req, res) {
    try {
      const { id } = req.params;
      const { title, tone } = req.body;
      const updates = {};
      if (title !== undefined) updates.title = title.trim();
      if (tone !== undefined) updates.tone = tone;

      const updated = await conversationRepo.update(id, updates);
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Conversation not found' });
      }
      res.json({ success: true, data: updated });
    } catch (err) {
      console.error('[updateConversation Error]', err);
      res.status(500).json({ success: false, error: 'Failed to update conversation' });
    }
  },

  // DELETE /api/conversations/:id
  async deleteConversation(req, res) {
    try {
      const { id } = req.params;
      const deleted = await conversationRepo.delete(id);
      if (!deleted) {
        return res.status(404).json({ success: false, error: 'Conversation not found' });
      }
      res.json({ success: true, message: 'Conversation deleted successfully' });
    } catch (err) {
      console.error('[deleteConversation Error]', err);
      res.status(500).json({ success: false, error: 'Failed to delete conversation' });
    }
  },

  // POST /api/conversations/:id/stream
  async streamChat(req, res) {
    const { id } = req.params;
    const { prompt, tone = 'Professional' } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return res.status(400).json({ success: false, error: 'Prompt is required' });
    }

    try {
      let conversation = null;
      let targetId = id;

      // Support creating conversation on the fly if id is 'new'
      if (id === 'new') {
        conversation = await conversationRepo.create({
          title: prompt.trim().slice(0, 36) + (prompt.trim().length > 36 ? '...' : ''),
          tone,
          messages: [],
        });
        targetId = conversation._id.toString();
      } else {
        conversation = await conversationRepo.getById(id);
        if (!conversation) {
          // If not found, gracefully auto-create thread
          conversation = await conversationRepo.create({
            title: prompt.trim().slice(0, 36) + (prompt.trim().length > 36 ? '...' : ''),
            tone,
            messages: [],
          });
          targetId = conversation._id.toString();
        }
      }

      // Prepare SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable buffering for Nginx/proxies
      });

      // Notify client of the target conversation ID immediately
      res.write(`data: ${JSON.stringify({ type: 'start', conversationId: targetId, tone })}\n\n`);

      const userMessage = {
        role: 'user',
        content: prompt.trim(),
        timestamp: new Date(),
        tone,
      };

      const historyMessages = [...(conversation.messages || []), userMessage];

      let fullAssistantResponse = '';
      let isClientAborted = false;

      req.on('close', () => {
        isClientAborted = true;
      });

      // Stream tokens from AI Service
      for await (const token of streamChatCompletion({ messages: historyMessages, tone })) {
        if (isClientAborted) break;
        fullAssistantResponse += token;
        res.write(`data: ${JSON.stringify({ type: 'token', token })}\n\n`);
      }

      const assistantMessage = {
        role: 'assistant',
        content: fullAssistantResponse,
        timestamp: new Date(),
        tone,
      };

      // Persist user and assistant messages in database
      const updatedDoc = await conversationRepo.appendMessages(targetId, userMessage, assistantMessage);

      // Signal completion and send persisted message metadata
      res.write(`data: ${JSON.stringify({
        type: 'done',
        conversationId: targetId,
        userMessage,
        assistantMessage,
        conversation: updatedDoc,
      })}\n\n`);

      res.end();
    } catch (err) {
      console.error('[streamChat Error]', err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: 'Internal streaming failure' });
      } else {
        res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`);
        res.end();
      }
    }
  },
};
