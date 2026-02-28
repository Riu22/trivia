import { useState, useEffect } from 'react'

export function Button({ children, variant = 'primary', size = 'md', loading, disabled, className = '', ...props }) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
    borderRadius: 'var(--radius)',
    border: '1px solid transparent',
    transition: 'all var(--transition)',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.5 : 1,
    whiteSpace: 'nowrap',
  }

  const sizes = {
    sm: { padding: '6px 12px', fontSize: '12px' },
    md: { padding: '10px 18px', fontSize: '14px' },
    lg: { padding: '13px 24px', fontSize: '15px' },
  }

  const variants = {
    primary: {
      background: 'var(--accent)',
      color: '#0a0a0a',
      borderColor: 'var(--accent)',
    },
    secondary: {
      background: 'var(--bg-2)',
      color: 'var(--text)',
      borderColor: 'var(--border)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-2)',
      borderColor: 'transparent',
    },
    danger: {
      background: 'var(--red-dim)',
      color: 'var(--red)',
      borderColor: 'rgba(255,71,71,0.3)',
    },
  }

  return (
    <button
      style={{ ...base, ...sizes[size], ...variants[variant] }}
      disabled={disabled || loading}
      className={className}
      {...props}
    >
      {loading ? <Spinner size={14} /> : children}
    </button>
  )
}

export function Card({ children, style, className = '', ...props }) {
  return (
    <div
      className={`animate-in ${className}`}
      style={{
        background: 'var(--bg-1)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
}

export function Input({ label, error, hint, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && (
        <label style={{ fontSize: '12px', color: 'var(--text-2)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </label>
      )}
      <input
        style={error ? { borderColor: 'var(--red)' } : {}}
        {...props}
      />
      {error && <span style={{ fontSize: '12px', color: 'var(--red)' }}>{error}</span>}
      {hint && !error && <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>{hint}</span>}
    </div>
  )
}

export function Spinner({ size = 20, color = 'currentColor' }) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      style={{ animation: 'spin 0.7s linear infinite', flexShrink: 0 }}
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  )
}

export function Badge({ children, color = 'default' }) {
  const colors = {
    default: { bg: 'var(--bg-3)', text: 'var(--text-2)', border: 'var(--border)' },
    accent: { bg: 'var(--accent-dim)', text: 'var(--accent)', border: 'rgba(232,255,71,0.3)' },
    green: { bg: 'var(--green-dim)', text: 'var(--green)', border: 'rgba(71,255,138,0.3)' },
    red: { bg: 'var(--red-dim)', text: 'var(--red)', border: 'rgba(255,71,71,0.3)' },
    blue: { bg: 'var(--blue-dim)', text: 'var(--blue)', border: 'rgba(71,184,255,0.3)' },
  }
  const c = colors[color]
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '2px 8px',
      borderRadius: '100px',
      fontSize: '11px',
      fontWeight: 600,
      fontFamily: 'var(--font-mono)',
      background: c.bg,
      color: c.text,
      border: `1px solid ${c.border}`,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    }}>
      {children}
    </span>
  )
}

export function Divider({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '4px 0' }}>
      <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
      {label && <span style={{ fontSize: '11px', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{label}</span>}
      <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
    </div>
  )
}

export function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.8)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.() }}
    >
      <Card style={{ width: '100%', maxWidth: '440px', maxHeight: '90vh', overflowY: 'auto' }}>
        {title && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>{title}</h2>
            <button
              onClick={onClose}
              style={{ color: 'var(--text-3)', fontSize: '20px', lineHeight: 1, padding: '4px', cursor: 'pointer', background: 'none', border: 'none' }}
            >
              ×
            </button>
          </div>
        )}
        {children}
      </Card>
    </div>
  )
}

let toastFn = null
export function setToastFn(fn) { toastFn = fn }
export function toast(msg, type = 'default') { toastFn?.(msg, type) }

export function ToastContainer() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    setToastFn((msg, type) => {
      const id = Date.now()
      setToasts(prev => [...prev, { id, msg, type }])
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
    })
  }, [])

  const colors = { default: 'var(--bg-3)', error: 'var(--red)', success: 'var(--green)' }

  return (
    <div data-toast-container style={{
      position: 'fixed', bottom: '24px', right: '24px',
      zIndex: 999, display: 'flex', flexDirection: 'column', gap: '8px',
      maxWidth: 'calc(100vw - 32px)',
    }}>
      {toasts.map(t => (
        <div key={t.id} className="animate-in" style={{
          background: 'var(--bg-2)',
          border: `1px solid ${colors[t.type] || 'var(--border)'}`,
          borderRadius: 'var(--radius)',
          padding: '12px 16px',
          fontSize: '13px',
          color: t.type === 'error' ? 'var(--red)' : t.type === 'success' ? 'var(--green)' : 'var(--text)',
          maxWidth: '320px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}>
          {t.msg}
        </div>
      ))}
    </div>
  )
}