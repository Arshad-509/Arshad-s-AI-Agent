import { useState, useRef, useCallback } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export function useChat() {
  const [messages, setMessages]   = useState([])
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)
  const [streaming, setStreaming] = useState(false)
  const abortRef = useRef(null)

  const sendMessage = useCallback(async ({
    question,
    provider,
    model,
    apiKey,
    stream,
    action,
    temperature,
  }) => {
    if (!question.trim() || loading) return

    const userMsg = { role: 'user', content: question.trim(), id: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)
    setError(null)

    const history = messages.map(({ role, content }) => ({ role, content }))

    try {
      const controller = new AbortController()
      abortRef.current = controller

      const res = await fetch(`${API_URL}/agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          question: question.trim(),
          provider,
          model,
          api_key: apiKey || undefined,
          stream,
          history,
          action,
          temperature,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `Server error ${res.status}`)
      }

      if (stream) {
        setStreaming(true)
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        const aiMsgId = Date.now() + 1
        setMessages(prev => [...prev, { role: 'assistant', content: '', id: aiMsgId }])

        let buffer = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop()
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const { token } = JSON.parse(line.slice(6))
                setMessages(prev =>
                  prev.map(m =>
                    m.id === aiMsgId ? { ...m, content: m.content + token } : m
                  )
                )
              } catch {}
            }
          }
        }
        setStreaming(false)
      } else {
        const data = await res.json()
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: data.answer, id: Date.now() + 1, model: data.model, provider: data.provider },
        ])
      }
    } catch (e) {
      if (e.name !== 'AbortError') {
        setError(e.message || 'Something went wrong.')
        setMessages(prev => prev.filter(m => m.role !== 'user' || m.id !== userMsg.id))
      }
    } finally {
      setLoading(false)
      setStreaming(false)
    }
  }, [messages, loading])

  const stopGeneration = () => {
    abortRef.current?.abort()
    setLoading(false)
    setStreaming(false)
  }

  const clearHistory = () => {
    setMessages([])
    setError(null)
  }

  const exportChat = () => {
    const text = messages
      .map(m => `[${m.role.toUpperCase()}]\n${m.content}`)
      .join('\n\n---\n\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `qa-chat-${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return { messages, loading, streaming, error, sendMessage, stopGeneration, clearHistory, exportChat }
}
