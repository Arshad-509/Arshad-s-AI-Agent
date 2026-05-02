/**
 * Lightweight markdown renderer (no external libs).
 * Handles: fenced code blocks, inline code, bold, italic, headers, lists, links.
 */
export function renderMarkdown(text) {
  if (!text) return ''

  const lines = text.split('\n')
  const html = []
  let i = 0
  let inList = false

  const closeList = () => {
    if (inList) { html.push('</ul>'); inList = false }
  }

  const escapeHtml = s =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  const inlineFormat = s =>
    s
      .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')

  while (i < lines.length) {
    const line = lines[i]

    // Fenced code block
    if (line.trim().startsWith('```')) {
      closeList()
      const lang = line.trim().slice(3).trim() || 'text'
      const codeLines = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(escapeHtml(lines[i]))
        i++
      }
      html.push(
        `<div class="code-block">` +
        `<div class="code-header"><span class="code-lang">${lang}</span>` +
        `<button class="copy-code-btn" onclick="navigator.clipboard.writeText(this.closest('.code-block').querySelector('code').innerText)">Copy</button></div>` +
        `<pre><code class="lang-${lang}">${codeLines.join('\n')}</code></pre></div>`
      )
      i++
      continue
    }

    // Headers
    const hm = line.match(/^(#{1,4})\s+(.+)/)
    if (hm) {
      closeList()
      const level = hm[1].length
      html.push(`<h${level} class="md-h${level}">${inlineFormat(escapeHtml(hm[2]))}</h${level}>`)
      i++; continue
    }

    // Horizontal rule
    if (/^[-*_]{3,}$/.test(line.trim())) {
      closeList()
      html.push('<hr class="md-hr" />')
      i++; continue
    }

    // Unordered list
    const lm = line.match(/^[-*+]\s+(.+)/)
    if (lm) {
      if (!inList) { html.push('<ul class="md-list">'); inList = true }
      html.push(`<li>${inlineFormat(escapeHtml(lm[1]))}</li>`)
      i++; continue
    }

    // Ordered list
    const om = line.match(/^\d+\.\s+(.+)/)
    if (om) {
      if (!inList) { html.push('<ol class="md-list">'); inList = true }
      html.push(`<li>${inlineFormat(escapeHtml(om[1]))}</li>`)
      i++; continue
    }

    closeList()

    // Blank line
    if (line.trim() === '') {
      html.push('<br/>')
      i++; continue
    }

    html.push(`<p class="md-p">${inlineFormat(escapeHtml(line))}</p>`)
    i++
  }
  closeList()
  return html.join('\n')
}
