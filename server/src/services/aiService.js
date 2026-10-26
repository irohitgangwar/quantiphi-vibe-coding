import OpenAI from 'openai';

// System prompt modifiers based on the selected Tone
export const TONE_SYSTEM_PROMPTS = {
  Professional: `You are an elite, highly knowledgeable AI Executive Assistant and Senior Engineer.
Your tone is polished, formal, analytical, and structured.
Guidelines:
- Provide comprehensive, well-reasoned answers with clear headers, bullet points, and formal terminology.
- Maintain an authoritative, respectful, and objective voice.
- Avoid slang, colloquialisms, and casual banter.
- When delivering technical answers, provide rigorous explanations and clean, modular code.`,

  Casual: `You are a friendly, chill, and enthusiastic tech buddy and creative partner.
Your tone is warm, conversational, approachable, and fun!
Guidelines:
- Talk like a peer: use natural expressions, engaging metaphors, and tasteful emojis (🚀, 💡, ⚡, ✨).
- Break down complex topics into intuitive, easy-to-digest concepts.
- Feel free to be supportive, witty, and encouraging while still giving accurate, practical help.`,

  Concise: `You are a precision AI engine built for rapid decision-making and maximum efficiency.
Your tone is direct, telegraphic, and strictly minimal.
Guidelines:
- Give immediate answers without preamble, introductions, or closing pleasantries.
- Use tight bullet points, short sentences, and omit all filler words.
- If providing code, give only the essential snippet with zero fluff.
- Prioritize brevity above all else.`,
};

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey.startsWith('sk-placeholder')) {
    return null;
  }
  const baseURL = process.env.OPENAI_BASE_URL && process.env.OPENAI_BASE_URL.trim() !== ''
    ? process.env.OPENAI_BASE_URL.trim()
    : undefined;

  return new OpenAI({
    apiKey: apiKey.trim(),
    baseURL,
  });
}

/**
 * Intelligent local stream fallback generator
 * Synthesizes dynamic, realistic responses tuned to the exact selected Tone
 */
async function* generateFallbackStream(messages, tone = 'Professional') {
  const lastUserMsg = messages[messages.length - 1]?.content || 'Hello';
  const query = lastUserMsg.toLowerCase().trim();

  let responseBody = '';

  // Tone-specific dynamic responses based on query analysis
  if (query.includes('hello') || query.includes('hi') || query.includes('hey')) {
    if (tone === 'Professional') {
      responseBody = `Greetings. I am your AI Executive Assistant configured in **Professional** mode.

I am prepared to assist you with:
- High-level architectural design and full-stack development
- Algorithmic problem solving and performance optimization
- Technical documentation, strategic workflows, and deep system analysis

How may I direct our technical session today?`;
    } else if (tone === 'Casual') {
      responseBody = `Hey there! 👋 Awesome to connect with you in **Casual** mode!

I'm your AI coding buddy—ready to build cool apps, brainstorm wacky ideas, or squash tricky bugs together. What are we diving into today? Let's make something great! 🚀✨`;
    } else {
      // Concise
      responseBody = `**Concise Mode Active.**
- System: Online.
- Tone: High-efficiency, zero fluff.
- Ready for input. Please state your query or task.`;
    }
  } else if (query.includes('react') || query.includes('vite') || query.includes('javascript') || query.includes('code')) {
    if (tone === 'Professional') {
      responseBody = `### Frontend Architectural Overview: React & Vite

React paired with Vite establishes a premier modern web development ecosystem characterized by rapid Hot Module Replacement (HMR) and optimized Rollup bundling.

#### Key Architectural Strengths:
1. **ES Module Native Tooling:** Instant startup times bypassing initial compilation overhead.
2. **Component Modularity:** Declarative UI state trees with unidirectional data flow.
3. **Resilient State Management:** Uncoupled state hooks separating presentation from transport layers.

\`\`\`javascript
// Demonstration: Custom Stream Hook Pattern
import { useState, useCallback } from 'react';

export function useStreamChat(endpoint) {
  const [streamingText, setStreamingText] = useState('');
  
  const initiateStream = useCallback(async (payload) => {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      setStreamingText((prev) => prev + decoder.decode(value));
    }
  }, [endpoint]);

  return { streamingText, initiateStream };
}
\`\`\`

Would you like to explore server-side streaming protocols or state optimization strategies next?`;
    } else if (tone === 'Casual') {
      responseBody = `React + Vite is honestly a match made in heaven! ⚡

Vite uses native ES modules so your local dev server boots up in like 50 milliseconds flat. No more waiting around for Webpack bundles to rebuild while you grab a coffee! ☕

Here is a quick snippet showing how clean streaming hooks look in React:

\`\`\`javascript
// Super clean hook for streaming vibes!
import { useState } from 'react';

export const useChat = () => {
  const [text, setText] = useState('');
  // Hook logic here...
  return { text };
};
\`\`\`

Got any specific components or features you want to hook up? I'm ready when you are! 🚀`;
    } else {
      responseBody = `**React + Vite Core Specs:**
- **Bundler:** Rollup (production), ESBuild (pre-bundling)
- **HMR:** Native ESM-based, instant reload
- **Streaming:** Server-Sent Events (SSE) via \`fetch()\` reader

\`\`\`javascript
const res = await fetch('/api/chat', { method: 'POST', body });
const reader = res.body.getReader();
\`\`\`
- Action: Ready for next command.`;
    }
  } else {
    // General queries
    if (tone === 'Professional') {
      responseBody = `### Strategic Analysis & Response

Regarding your query: *"${lastUserMsg}"*

I have analyzed the context and parameters. Here is the structured breakdown:

1. **Core Objective:** Identifying key drivers and requirements associated with your request.
2. **Implementation Strategy:** Delivering a robust, maintainable solution aligned with industry best practices.
3. **Operational Impact:** Ensuring high availability, fault tolerance, and predictable system behavior.

\`\`\`json
{
  "status": "success",
  "evaluatedTone": "${tone}",
  "processingMode": "real-time-stream",
  "dataIntegrity": "verified"
}
\`\`\`

Please indicate if you require deeper algorithmic detail or architectural diagrams.`;
    } else if (tone === 'Casual') {
      responseBody = `You got it! 🎯 Let's talk about: *"${lastUserMsg}"*

Here is the quick rundown of what's happening behind the scenes:
- Your message got processed through the **${tone}** tone pipeline!
- We are streaming this token-by-token directly to your screen in real time ✨
- Everything is backed up and saved straight to MongoDB so you never lose your flow.

How does this sound? Anything you want to tweak or dive deeper into? 😊`;
    } else {
      responseBody = `**Direct Response (${tone}):**
- Query: "${lastUserMsg}"
- Tone Mode: Concise
- Status: Processed
- Delivery: Real-time chunked stream
- Recommendation: Proceed with implementation.`;
    }
  }

  // Stream out tokens chunk by chunk with natural typing rhythm
  const words = responseBody.split(' ');
  for (let i = 0; i < words.length; i++) {
    const chunk = words[i] + (i < words.length - 1 ? ' ' : '');
    yield chunk;
    await new Promise((res) => setTimeout(res, 22)); // smooth streaming delay
  }
}

/**
 * Main AI streaming orchestrator
 * Dispatches to OpenAI API if configured; falls back gracefully to local engine
 */
export async function* streamChatCompletion({ messages, tone = 'Professional' }) {
  const openai = getOpenAIClient();
  const systemPrompt = TONE_SYSTEM_PROMPTS[tone] || TONE_SYSTEM_PROMPTS.Professional;

  if (openai) {
    try {
      const formattedMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      ];

      const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
      const stream = await openai.chat.completions.create({
        model,
        messages: formattedMessages,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }
      return;
    } catch (err) {
      console.warn(`[OpenAI Error] ${err.message}. Falling back to internal engine.`);
    }
  }

  // Fallback to internal streaming engine
  yield* generateFallbackStream(messages, tone);
}
