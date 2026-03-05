import { useState, useEffect } from 'react'
import { Button } from './Ui'

export default function InstallButton() {
  const [prompt, setPrompt] = useState(window.__installPrompt || null)
  const [installed, setInstalled] = useState(false)
  const [showManual, setShowManual] = useState(false)

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      window.__installPrompt = e
      setPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => setInstalled(true))
    if (window.matchMedia('(display-mode: standalone)').matches) setInstalled(true)

    const interval = setInterval(() => {
      if (window.__installPrompt) {
        setPrompt(window.__installPrompt)
        clearInterval(interval)
      }
    }, 500)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      clearInterval(interval)
    }
  }, [])

  async function handleInstall() {
    const p = prompt || window.__installPrompt
    if (p) {
      p.prompt()
      const { outcome } = await p.userChoice
      if (outcome === 'accepted') setInstalled(true)
      window.__installPrompt = null
      setPrompt(null)
    } else {
      setShowManual(true)
    }
  }

  if (installed) return null

  return (
    <>
      <button
        onClick={handleInstall}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '6px 14px', borderRadius: 'var(--radius)',
          background: 'var(--bg-2)', border: '1px solid var(--border)',
          color: 'var(--text-2)', fontSize: '12px', cursor: 'pointer',
          fontFamily: 'var(--font-display)', fontWeight: 600,
          transition: 'all var(--transition)',
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 3v13M5 14l7 7 7-7"/>
          <path d="M3 21h18"/>
        </svg>
        Install App
      </button>

      {showManual && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '24px',
        }} onClick={() => setShowManual(false)}>
          <div style={{
            background: 'var(--bg-1)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '28px',
            maxWidth: '340px', width: '100%',
          }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px' }}>Install Trivia</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6, marginBottom: '16px' }}>
              To install on <strong style={{ color: 'var(--text)' }}>Chrome / Edge</strong>:
              click the <strong style={{ color: 'var(--accent)' }}>⊕</strong> icon in the address bar, or open the menu (⋮) → "Install Trivia".
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6, marginBottom: '20px' }}>
              To install on <strong style={{ color: 'var(--text)' }}>Safari (iOS)</strong>:
              tap <strong style={{ color: 'var(--accent)' }}>Share</strong> → "Add to Home Screen".
            </p>
            <Button onClick={() => setShowManual(false)} style={{ width: '100%' }}>
              Got it
            </Button>
          </div>
        </div>
      )}
    </>
  )
}