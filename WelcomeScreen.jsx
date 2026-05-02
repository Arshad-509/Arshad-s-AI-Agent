import './WelcomeScreen.css'

const CAPABILITIES = [
  { icon: '🧪', title: 'Test Case Generation', desc: 'Unit, integration, e2e, performance, and security test cases.' },
  { icon: '🤖', title: 'Automation Scripts', desc: 'Playwright, Selenium, Cypress, pytest, and JUnit scripts.' },
  { icon: '🔍', title: 'Code Review', desc: 'QA-focused review for edge cases, coverage, and testability.' },
  { icon: '🌐', title: 'Web Search', desc: 'Fetch live results and synthesise up-to-date answers.' },
  { icon: '🔬', title: 'DOM Locator Gen', desc: 'Paste HTML or a URL to generate Page Object Models.' },
  { icon: '⚡', title: 'Performance Testing', desc: 'k6, JMeter, Locust scripts and strategy guidance.' },
]

export default function WelcomeScreen() {
  return (
    <div className="welcome">
      <div className="welcome-hero">
        <div className="welcome-icon">🧪</div>
        <h1 className="welcome-title">QA AI Assistant</h1>
        <p className="welcome-sub">
          Enterprise-grade AI for software quality assurance and full-stack testing.
          Powered by Groq, Gemini, OpenAI, Claude, DeepSeek &amp; Mistral.
        </p>
        <p className="welcome-credit">Designed &amp; developed by <strong>Arshad Shaik</strong></p>
      </div>
      <div className="capabilities-grid">
        {CAPABILITIES.map(c => (
          <div className="cap-card" key={c.title}>
            <span className="cap-icon">{c.icon}</span>
            <h3 className="cap-title">{c.title}</h3>
            <p className="cap-desc">{c.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
