import mongoose from 'mongoose';
import { isDbConnected } from '../db.js';

const MessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  tone: {
    type: String,
    enum: ['Professional', 'Casual', 'Concise'],
    default: 'Professional',
  },
});

const ConversationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: 'New Conversation',
      trim: true,
    },
    tone: {
      type: String,
      enum: ['Professional', 'Casual', 'Concise'],
      default: 'Professional',
    },
    messages: [MessageSchema],
  },
  {
    timestamps: true,
  }
);

export const ConversationModel = mongoose.model('Conversation', ConversationSchema);

// In-Memory Fallback Store (Used seamlessly if MongoDB is disconnected)
class MemoryStore {
  constructor() {
    this.conversations = new Map();
  }

  generateId() {
    return 'mem_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  async getAll(search = '') {
    let list = Array.from(this.conversations.values());
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        c => c.title.toLowerCase().includes(q) ||
        c.messages.some(m => m.content.toLowerCase().includes(q))
      );
    }
    return list.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  async getById(id) {
    return this.conversations.get(id) || null;
  }

  async create(data) {
    const id = this.generateId();
    const now = new Date();
    const doc = {
      _id: id,
      title: data.title || 'New Conversation',
      tone: data.tone || 'Professional',
      messages: data.messages || [],
      createdAt: now,
      updatedAt: now,
    };
    this.conversations.set(id, doc);
    return doc;
  }

  async update(id, updates) {
    const existing = this.conversations.get(id);
    if (!existing) return null;
    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.conversations.set(id, updated);
    return updated;
  }

  async addMessage(id, message) {
    const existing = this.conversations.get(id);
    if (!existing) return null;
    const msg = {
      _id: this.generateId(),
      ...message,
      timestamp: message.timestamp || new Date(),
    };
    existing.messages.push(msg);
    existing.updatedAt = new Date();
    this.conversations.set(id, existing);
    return existing;
  }

  async delete(id) {
    return this.conversations.delete(id);
  }
}

export const memoryStore = new MemoryStore();

// Unified Data Repository
export const conversationRepo = {
  async list(search = '') {
    if (isDbConnected()) {
      try {
        const filter = search
          ? {
              $or: [
                { title: { $regex: search, $options: 'i' } },
                { 'messages.content': { $regex: search, $options: 'i' } },
              ],
            }
          : {};
        return await ConversationModel.find(filter)
          .sort({ updatedAt: -1 })
          .select('_id title tone createdAt updatedAt messages')
          .lean();
      } catch (err) {
        console.warn('[Repo] Falling back to memory store:', err.message);
      }
    }
    return await memoryStore.getAll(search);
  },

  async getById(id) {
    if (isDbConnected() && mongoose.Types.ObjectId.isValid(id)) {
      try {
        const doc = await ConversationModel.findById(id).lean();
        if (doc) return doc;
      } catch (err) {
        console.warn('[Repo] Error fetching from Mongo, checking memory:', err.message);
      }
    }
    return await memoryStore.getById(id);
  },

  async create(data) {
    if (isDbConnected()) {
      try {
        const doc = await ConversationModel.create(data);
        return doc.toObject();
      } catch (err) {
        console.warn('[Repo] Failed to create in Mongo, saving in memory:', err.message);
      }
    }
    return await memoryStore.create(data);
  },

  async update(id, updates) {
    if (isDbConnected() && mongoose.Types.ObjectId.isValid(id)) {
      try {
        const doc = await ConversationModel.findByIdAndUpdate(
          id,
          { $set: updates },
          { new: true, runValidators: true }
        ).lean();
        if (doc) return doc;
      } catch (err) {
        console.warn('[Repo] Failed to update in Mongo:', err.message);
      }
    }
    return await memoryStore.update(id, updates);
  },

  async appendMessages(id, userMsg, assistantMsg) {
    if (isDbConnected() && mongoose.Types.ObjectId.isValid(id)) {
      try {
        const doc = await ConversationModel.findById(id);
        if (doc) {
          doc.messages.push(userMsg);
          doc.messages.push(assistantMsg);
          // Auto-title conversation if it still has default title
          if (doc.title === 'New Conversation' && userMsg.content) {
            doc.title = userMsg.content.slice(0, 36) + (userMsg.content.length > 36 ? '...' : '');
          }
          await doc.save();
          return doc.toObject();
        }
      } catch (err) {
        console.warn('[Repo] Failed to append in Mongo:', err.message);
      }
    }

    // Memory fallback
    const memDoc = await memoryStore.getById(id);
    if (memDoc) {
      await memoryStore.addMessage(id, userMsg);
      await memoryStore.addMessage(id, assistantMsg);
      if (memDoc.title === 'New Conversation' && userMsg.content) {
        await memoryStore.update(id, {
          title: userMsg.content.slice(0, 36) + (userMsg.content.length > 36 ? '...' : ''),
        });
      }
      return await memoryStore.getById(id);
    }
    return null;
  },

  async delete(id) {
    if (isDbConnected() && mongoose.Types.ObjectId.isValid(id)) {
      try {
        await ConversationModel.findByIdAndDelete(id);
        return true;
      } catch (err) {
        console.warn('[Repo] Failed to delete in Mongo:', err.message);
      }
    }
    return await memoryStore.delete(id);
  },
};
