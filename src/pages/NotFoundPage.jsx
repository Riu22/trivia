import { useNavigate } from 'react-router-dom'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '16px',
      textAlign: 'center',
      padding: '24px',
    }}>
      <div style={{
        fontSize: '72px',
        fontWeight: 800,
        color: 'var(--text-3)',
        fontFamily: 'var(--font-mono)',
        lineHeight: 1,
      }}>
        404
      </div>
      <h1 style={{ fontWeight: 800, fontSize: '22px', letterSpacing: '-0.02em' }}>
        Page not found
      </h1>
      <p style={{ color: 'var(--text-2)', fontSize: '14px' }}>
        This page doesn't exist.
      </p>
      <button
        onClick={() => navigate('/')}
        style={{
          marginTop: '8px',
          padding: '10px 20px',
          borderRadius: 'var(--radius)',
          background: 'var(--bg-2)',
          border: '1px solid var(--border)',
          color: 'var(--text)',
          fontFamily: 'var(--font-display)',
          fontWeight: 600,
          fontSize: '14px',
          cursor: 'pointer',
        }}
      >
        ← Go Home
      </button>
    </div>
  )
}