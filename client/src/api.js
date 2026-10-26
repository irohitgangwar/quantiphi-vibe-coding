const API_BASE = '/api';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

export async function fetchConversations(search = '') {
  const url = search
    ? `${API_BASE}/conversations?search=${encodeURIComponent(search)}`
    : `${API_BASE}/conversations`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to load conversations');
  const json = await res.json();
  return json.data || [];
}

export async function fetchConversation(id) {
  const res = await fetch(`${API_BASE}/conversations/${id}`);
  if (!res.ok) throw new Error('Failed to load conversation');
  const json = await res.json();
  return json.data;
}

export async function createConversation(payload = {}) {
  const res = await fetch(`${API_BASE}/conversations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create conversation');
  const json = await res.json();
  return json.data;
}

export async function updateConversation(id, updates) {
  const res = await fetch(`${API_BASE}/conversations/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update conversation');
  const json = await res.json();
  return json.data;
}

export async function deleteConversation(id) {
  const res = await fetch(`${API_BASE}/conversations/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete conversation');
  return res.json();
}

/**
 * Real-time SSE streaming chat reader
 * Reads text/event-stream chunks line-by-line and triggers callbacks
 */
export async function streamChatMessage({
  conversationId,
  prompt,
  tone,
  onStart,
  onToken,
  onDone,
  onError,
  signal,
}) {
  const targetId = conversationId || 'new';
  try {
    const response = await fetch(`${API_BASE}/conversations/${targetId}/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, tone }),
      signal,
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      throw new Error(errorJson.error || `Server responded with status ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete trailing fragment in buffer

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;

        const dataStr = trimmed.replace(/^data:\s*/, '');
        try {
          const parsed = JSON.parse(dataStr);
          if (parsed.type === 'start') {
            onStart && onStart(parsed);
          } else if (parsed.type === 'token') {
            onToken && onToken(parsed.token);
          } else if (parsed.type === 'done') {
            onDone && onDone(parsed);
          } else if (parsed.type === 'error') {
            onError && onError(new Error(parsed.error));
          }
        } catch (jsonErr) {
          console.warn('[Stream Parse Warning]', jsonErr, dataStr);
        }
      }
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      console.log('[Stream] Request was cancelled by the user.');
    } else {
      onError && onError(err);
    }
  }
}
