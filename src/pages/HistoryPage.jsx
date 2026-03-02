import { getHistory, clearHistory } from '../utils/history'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card } from '../components/Ui'

export default function HistoryPage() {
  const navigate = useNavigate()
  const [history, setHistory] = useState(getHistory)

  function handleClear() {
    if (!window.confirm('Clear all history?')) return
    clearHistory()
    setHistory([])
  }

  return (
    <div style={{ minHeight: '100vh', padding: '24px', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <button onClick={() => navigate('/')} style={{ color: 'var(--text-3)', fontSize: '13px', marginBottom: '8px' }}>
            ← Home
          </button>
          <h1 style={{ fontSize: '22px', fontWeight: 800 }}>Match History</h1>
        </div>
        {history.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleClear} style={{ color: 'var(--text-3)' }}>
            Clear
          </Button>
        )}
      </div>

      {history.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 24px', color: 'var(--text-3)' }}>
          <p style={{ fontSize: '32px', marginBottom: '12px' }}>🎮</p>
          <p>No games played yet</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {history.map(entry => (
            <Card key={entry.id}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>
                    Game #{entry.id}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                    Room #{entry.roomId} · {entry.rounds} rounds · {entry.players.length} players
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-3)', textAlign: 'right' }}>
                  {new Date(entry.playedAt).toLocaleDateString()}<br />
                  <span style={{ fontFamily: 'var(--font-mono)' }}>
                    {new Date(entry.playedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {entry.players.map(p => (
                  <span key={p.id} style={{
                    padding: '3px 10px',
                    borderRadius: '999px',
                    background: p.id === entry.myId ? 'var(--accent-dim)' : 'var(--bg-3)',
                    border: `1px solid ${p.id === entry.myId ? 'var(--border-active)' : 'var(--border)'}`,
                    color: p.id === entry.myId ? 'var(--accent)' : 'var(--text-2)',
                    fontSize: '12px',
                    fontWeight: p.id === entry.myId ? 600 : 400,
                  }}>
                    {p.username}{p.id === entry.myId ? ' (you)' : ''}
                  </span>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}