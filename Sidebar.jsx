import { useState } from 'react'
import './Sidebar.css'

const PROVIDER_ICONS = {
  groq:      '⚡',
  gemini:    '✦',
  openai:    '◈',
  anthropic: '◬',
  deepseek:  '◉',
  mistral:   '◇',
}

const PROVIDER_COLORS = {
  groq:      '#f97316',
  gemini:    '#4285f4',
  openai:    '#10a37f',
  anthropic: '#d97706',
  deepseek:  '#7c3aed',
  mistral:   '#e11d48',
}

export default function Sidebar({
  providers,
  backendOnline,
  provider, setProvider,
  model, setModel,
  apiKeys, setApiKey,
  stream, setStream,
  temperature, setTemperature,
  onClear,
  onExport,
  theme, setTheme,
  messageCount,
}) {
  const [showKey, setShowKey] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const handleProviderChange = (p) => {
    setProvider(p)
    if (providers?.[p]) {
      setModel(providers[p].default_model)
    }
  }

  if (collapsed) return (
    <div className="sidebar sidebar--collapsed">
      <button className="collapse-btn" onClick={() => setCollapsed(false)} title="Expand sidebar">☰</button>
    </div>
  )

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <span className="brand-icon">🧪</span>
          <span className="brand-name">QA Assistant</span>
        </div>
        <button className="collapse-btn" onClick={() => setCollapsed(true)} title="Collapse">✕</button>
      </div>

      {/* Backend status */}
      <div className={`status-badge ${backendOnline ? 'status-online' : 'status-offline'}`}>
        <span className="status-dot" />
        {backendOnline ? 'Backend online' : 'Backend offline'}
      </div>

      {/* Provider selection */}
      <section className="sidebar-section">
        <h3 className="section-label">AI Provider</h3>
        <div className="provider-grid">
          {providers && Object.keys(providers).map(p => (
            <button
              key={p}
              className={`provider-btn ${provider === p ? 'provider-btn--active' : ''}`}
              style={provider === p ? { borderColor: PROVIDER_COLORS[p], color: PROVIDER_COLORS[p] } : {}}
              onClick={() => handleProviderChange(p)}
              title={p}
            >
              <span>{PROVIDER_ICONS[p] || '◉'}</span>
              <span>{p}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Model select */}
      {providers?.[provider] && (
        <section className="sidebar-section">
          <h3 className="section-label">Model</h3>
          <select
            className="sidebar-select"
            value={model}
            onChange={e => setModel(e.target.value)}
          >
            {providers[provider].models.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </section>
      )}

      {/* API Key */}
      <section className="sidebar-section">
        <h3 className="section-label">API Key ({provider})</h3>
        <div className="key-input-wrap">
          <input
            type={showKey ? 'text' : 'password'}
            className="sidebar-input"
            placeholder={`${provider} API key…`}
            value={apiKeys[provider] || ''}
            onChange={e => setApiKey(provider, e.target.value)}
          />
          <button className="show-key-btn" onClick={() => setShowKey(s => !s)}>
            {showKey ? '🙈' : '👁'}
          </button>
        </div>
        <p className="key-hint">Stored locally. Not sent to our servers.</p>
      </section>

      {/* Temperature */}
      <section className="sidebar-section">
        <h3 className="section-label">Temperature <span className="temp-value">{temperature}</span></h3>
        <input
          type="range" min="0" max="1" step="0.1"
          value={temperature}
          className="sidebar-range"
          onChange={e => setTemperature(parseFloat(e.target.value))}
        />
        <div className="range-labels"><span>Precise</span><span>Creative</span></div>
      </section>

      {/* Stream toggle */}
      <section className="sidebar-section">
        <label className="toggle-row">
          <span className="section-label" style={{ marginBottom: 0 }}>Streaming</span>
          <div
            className={`toggle ${stream ? 'toggle--on' : ''}`}
            onClick={() => setStream(s => !s)}
          >
            <div className="toggle-thumb" />
          </div>
        </label>
        <p className="key-hint">{stream ? 'Real-time token streaming' : 'Single response'}</p>
      </section>

      {/* Theme */}
      <section className="sidebar-section">
        <label className="toggle-row">
          <span className="section-label" style={{ marginBottom: 0 }}>Dark mode</span>
          <div
            className={`toggle ${theme === 'dark' ? 'toggle--on' : ''}`}
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
          >
            <div className="toggle-thumb" />
          </div>
        </label>
      </section>

      {/* Actions */}
      <section className="sidebar-section sidebar-actions">
        <button className="action-btn" onClick={onExport} disabled={messageCount === 0}>
          ↓ Export chat
        </button>
        <button className="action-btn action-btn--danger" onClick={onClear} disabled={messageCount === 0}>
          ✕ Clear history
        </button>
      </section>

      <div className="sidebar-footer">
        <p>Designed & developed by</p>
        <p className="footer-author">Arshad Shaik</p>
      </div>
    </aside>
  )
}
