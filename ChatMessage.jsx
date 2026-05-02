import { useMemo, useState } from 'react'
import { renderMarkdown } from '../utils/markdown'
import './ChatMessage.css'

export default function ChatMessage({ message, onRegenerate }) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'

  const html = useMemo(
    () => isUser ? null : renderMarkdown(message.content),
    [message.content, isUser]
  )

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`message-row ${isUser ? 'message-row--user' : 'message-row--ai'}`}>
      <div className="message-avatar">
        {isUser ? '👤' : '🤖'}
      </div>
      <div className="message-bubble-wrap">
        <div className={`message-bubble ${isUser ? 'bubble-user' : 'bubble-ai'}`}>
          {isUser ? (
            <p className="user-text">{message.content}</p>
          ) : (
            <div
              className="md-content"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )}
        </div>
        {!isUser && (
          <div className="message-actions">
            {message.model && (
              <span className="msg-meta">{message.provider} · {message.model}</span>
            )}
            <button className={`msg-action-btn ${copied ? 'msg-action-btn--copied' : ''}`} onClick={handleCopy}>
              {copied ? '✓ Copied' : '⎘ Copy'}
            </button>
            {onRegenerate && (
              <button className="msg-action-btn" onClick={onRegenerate}>↺ Retry</button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
