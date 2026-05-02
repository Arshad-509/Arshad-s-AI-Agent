import { useState, useRef } from 'react'
import './ChatInput.css'

const ACTIONS = [
  { value: 'chat',        label: '💬 Chat',        hint: 'General QA & code questions' },
  { value: 'websearch',   label: '🔍 Web Search',   hint: 'Search web for latest info' },
  { value: 'dom_locator', label: '🔬 DOM Locator',  hint: 'Paste HTML or URL for locators' },
]

const SUGGESTIONS = [
  'Generate Playwright tests for a login form with username, password, and remember-me checkbox.',
  'Write a pytest fixture for a PostgreSQL test database with rollback cleanup.',
  'Review this API endpoint for security vulnerabilities and missing test coverage.',
  'Generate k6 performance test script for an e-commerce checkout flow.',
  'What are best practices for testing async React components with React Testing Library?',
]

export default function ChatInput({ onSubmit, loading, onStop, disabled }) {
  const [text, setText]   = useState('')
  const [action, setAction] = useState('chat')
  const ref = useRef(null)

  const submit = () => {
    if (!text.trim() || loading || disabled) return
    onSubmit(text.trim(), action)
    setText('')
  }

  const onKey = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); submit() }
  }

  return (
    <div className="chat-input-area">
      {/* Suggestion pills (only when empty) */}
      {!text && (
        <div className="suggestions-bar">
          {SUGGESTIONS.map((s, i) => (
            <button key={i} className="suggestion-pill" onClick={() => { setText(s); ref.current?.focus() }}>
              {s.length > 55 ? s.slice(0, 55) + '…' : s}
            </button>
          ))}
        </div>
      )}

      <div className="input-box">
        {/* Action selector */}
        <div className="action-tabs">
          {ACTIONS.map(a => (
            <button
              key={a.value}
              className={`action-tab ${action === a.value ? 'action-tab--active' : ''}`}
              onClick={() => setAction(a.value)}
              title={a.hint}
            >
              {a.label}
            </button>
          ))}
        </div>

        <textarea
          ref={ref}
          className="message-textarea"
          placeholder={
            action === 'websearch'   ? 'Search query or question…' :
            action === 'dom_locator' ? 'Paste URL or raw HTML…' :
            'Ask a QA or testing question…'
          }
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={onKey}
          rows={3}
          disabled={disabled}
        />

        <div className="input-footer">
          <span className="input-hint">⌘ Enter to send</span>
          <div className="input-btns">
            {loading && (
              <button className="btn-stop" onClick={onStop}>⏹ Stop</button>
            )}
            <button
              className="btn-send"
              onClick={submit}
              disabled={!text.trim() || loading || disabled}
            >
              {loading ? <span className="sending-dots"><span/><span/><span/></span> : 'Send →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
