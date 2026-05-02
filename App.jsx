import { useState, useEffect, useRef } from 'react'
import Sidebar from './components/Sidebar'
import ChatMessage from './components/ChatMessage'
import ChatInput from './components/ChatInput'
import WelcomeScreen from './components/WelcomeScreen'
import { useChat } from './hooks/useChat'
import { useProviders } from './hooks/useProviders'
import './App.css'

export default function App() {
  // Theme
  const [theme, setTheme] = useState(() => localStorage.getItem('qa-theme') || 'light')
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('qa-theme', theme)
  }, [theme])

  // Provider settings
  const { providers, backendOnline } = useProviders()
  const [provider, setProvider]     = useState('groq')
  const [model, setModel]           = useState('llama-3.3-70b-versatile')
  const [stream, setStream]         = useState(true)
  const [temperature, setTemperature] = useState(0.7)

  // Per-provider API keys
  const [apiKeys, setApiKeys] = useState(() => {
    try { return JSON.parse(localStorage.getItem('qa-api-keys') || '{}') } catch { return {} }
  })
  const setApiKey = (prov, val) => {
    setApiKeys(prev => {
      const next = { ...prev, [prov]: val }
      localStorage.setItem('qa-api-keys', JSON.stringify(next))
      return next
    })
  }

  // Sync model when provider changes
  useEffect(() => {
    if (providers?.[provider]) setModel(providers[provider].default_model)
  }, [provider, providers])

  const { messages, loading, streaming, error, sendMessage, stopGeneration, clearHistory, exportChat } = useChat()

  const bottomRef = useRef(null)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = (question, action) => {
    sendMessage({ question, provider, model, apiKey: apiKeys[provider], stream, action, temperature })
  }

  return (
    <div className="app-shell">
      <Sidebar
        providers={providers}
        backendOnline={backendOnline}
        provider={provider} setProvider={setProvider}
        model={model} setModel={setModel}
        apiKeys={apiKeys} setApiKey={setApiKey}
        stream={stream} setStream={setStream}
        temperature={temperature} setTemperature={setTemperature}
        onClear={clearHistory}
        onExport={exportChat}
        theme={theme} setTheme={setTheme}
        messageCount={messages.length}
      />

      <div className="chat-area">
        <div className="chat-scroll">
          {messages.length === 0
            ? <WelcomeScreen />
            : (
              <div className="messages-list">
                {messages.map((m, i) => (
                  <ChatMessage
                    key={m.id || i}
                    message={m}
                    onRegenerate={
                      m.role === 'assistant' && i === messages.length - 1
                        ? () => {
                            const lastUser = [...messages].reverse().find(x => x.role === 'user')
                            if (lastUser) handleSend(lastUser.content, 'chat')
                          }
                        : null
                    }
                  />
                ))}
                {loading && !streaming && (
                  <div className="thinking-row">
                    <div className="thinking-avatar">🤖</div>
                    <div className="thinking-bubble">
                      <span className="dot"/><span className="dot"/><span className="dot"/>
                    </div>
                  </div>
                )}
                {error && (
                  <div className="error-toast" role="alert">
                    ⚠ {error}
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            )
          }
        </div>

        <ChatInput
          onSubmit={handleSend}
          onStop={stopGeneration}
          loading={loading}
          disabled={false}
        />
      </div>
    </div>
  )
}
