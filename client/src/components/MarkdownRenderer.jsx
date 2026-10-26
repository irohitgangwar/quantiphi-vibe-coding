import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

function CodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-block">
      <div className="code-header">
        <span>{language || 'code'}</span>
        <button
          className="btn-copy-code"
          onClick={handleCopy}
          title="Copy code to clipboard"
          aria-label="Copy code"
        >
          {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}

/**
 * Lightweight, robust Markdown Renderer supporting code blocks, bold, headers, lists, and inline code
 */
export function MarkdownRenderer({ content = '' }) {
  if (!content) return null;

  // Split content by code blocks ```lang ... ```
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        value: content.slice(lastIndex, match.index),
      });
    }
    parts.push({
      type: 'code',
      language: match[1] || 'text',
      value: match[2],
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({
      type: 'text',
      value: content.slice(lastIndex),
    });
  }

  // Render text blocks with paragraphs, bold, lists, and inline code
  const renderTextBlock = (text, keyPrefix) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();

      // Headers
      if (trimmed.startsWith('#### ')) {
        return <h4 key={`${keyPrefix}-${idx}`}>{formatInline(trimmed.slice(5))}</h4>;
      }
      if (trimmed.startsWith('### ')) {
        return <h3 key={`${keyPrefix}-${idx}`}>{formatInline(trimmed.slice(4))}</h3>;
      }
      if (trimmed.startsWith('## ')) {
        return <h2 key={`${keyPrefix}-${idx}`}>{formatInline(trimmed.slice(3))}</h2>;
      }
      if (trimmed.startsWith('# ')) {
        return <h1 key={`${keyPrefix}-${idx}`}>{formatInline(trimmed.slice(2))}</h1>;
      }

      // Bullet points
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        return (
          <ul key={`${keyPrefix}-${idx}`}>
            <li>{formatInline(trimmed.slice(2))}</li>
          </ul>
        );
      }

      // Numbered lists
      const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
      if (numMatch) {
        return (
          <ol key={`${keyPrefix}-${idx}`} start={parseInt(numMatch[1], 10)}>
            <li>{formatInline(numMatch[2])}</li>
          </ol>
        );
      }

      // Empty line
      if (!trimmed) {
        return <div key={`${keyPrefix}-${idx}`} style={{ height: '0.45rem' }} />;
      }

      // Standard paragraph
      return <p key={`${keyPrefix}-${idx}`}>{formatInline(line)}</p>;
    });
  };

  // Helper to format **bold** and `code`
  const formatInline = (str) => {
    const tokens = [];
    const inlineRegex = /(\*\*.*?\*\*|`.*?`)/g;
    let last = 0;
    let m;

    while ((m = inlineRegex.exec(str)) !== null) {
      if (m.index > last) {
        tokens.push(str.slice(last, m.index));
      }
      const token = m[0];
      if (token.startsWith('**') && token.endsWith('**')) {
        tokens.push(<strong key={m.index}>{token.slice(2, -2)}</strong>);
      } else if (token.startsWith('`') && token.endsWith('`')) {
        tokens.push(<code key={m.index}>{token.slice(1, -1)}</code>);
      }
      last = m.index + token.length;
    }

    if (last < str.length) {
      tokens.push(str.slice(last));
    }

    return tokens;
  };

  return (
    <div className="markdown-body">
      {parts.map((part, index) => {
        if (part.type === 'code') {
          return <CodeBlock key={index} language={part.language} code={part.value} />;
        }
        return <React.Fragment key={index}>{renderTextBlock(part.value, index)}</React.Fragment>;
      })}
    </div>
  );
}
