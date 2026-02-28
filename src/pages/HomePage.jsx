import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { createRoom, joinRoom } from '../api'
import { useAuth } from '../contexts/AuthContext'
import { Button, Input, Card, Divider, toast } from '../components/Ui'

export default function HomePage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    if (searchParams.get('kicked') === '1') {
      toast('You have been removed from the room', 'error')
      setSearchParams({})
    }
  }, [])

  const [tab, setTab] = useState('join')

  const [createCode, setCreateCode] = useState('')
  const [createUsername, setCreateUsername] = useState('')
  const [creating, setCreating] = useState(false)

  const [joinUrl, setJoinUrl] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [joinUsername, setJoinUsername] = useState('')
  const [joining, setJoining] = useState(false)

  async function handleCreate(e) {
    e.preventDefault()
    if (!createCode.trim() || !createUsername.trim()) return
    setCreating(true)
    try {
      const room = await createRoom(createCode)
      const { player, token } = await joinRoom(room.id, createCode, createUsername)
      login(player, token)
      navigate(`/room/${room.id}`)
    } catch (err) {
      toast(err.message || 'Error creating room', 'error')
    } finally {
      setCreating(false)
    }
  }

  async function handleJoin(e) {
    e.preventDefault()
    let roomId = joinUrl.trim()
    const match = roomId.match(/\/room\/(\d+)/)
    if (match) roomId = match[1]
    if (!roomId || !joinCode.trim() || !joinUsername.trim()) return
    setJoining(true)
    try {
      const { player, token } = await joinRoom(Number(roomId), joinCode, joinUsername)
      login(player, token)
      navigate(`/room/${roomId}`)
    } catch (err) {
      const msg = err.status === 400
        ? 'Invalid room code'
        : err.status === 404
          ? 'Room not found'
          : err.message || 'Error joining room'
      toast(msg, 'error')
    } finally {
      setJoining(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(232,255,71,0.06) 0%, transparent 70%)',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px', height: '48px',
            background: 'var(--accent)',
            borderRadius: '12px',
            marginBottom: '16px',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth="2.5" strokeLinecap="round">
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <circle cx="12" cy="12" r="10" />
              <path d="M12 17h.01" />
            </svg>
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em' }}>Trivia</h1>
          <p style={{ color: 'var(--text-2)', fontSize: '14px', marginTop: '6px' }}>Play with friends, anywhere</p>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          background: 'var(--bg-2)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '4px',
          marginBottom: '20px',
        }}>
          {['join', 'create'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '8px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                fontFamily: 'var(--font-display)',
                background: tab === t ? 'var(--bg-3)' : 'transparent',
                color: tab === t ? 'var(--text)' : 'var(--text-3)',
                border: tab === t ? '1px solid var(--border-active)' : '1px solid transparent',
                transition: 'all var(--transition)',
                textTransform: 'capitalize',
              }}
            >
              {t === 'join' ? 'Join Room' : 'Create Room'}
            </button>
          ))}
        </div>

        <Card>
          {tab === 'join' ? (
            <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Input
                label="Room URL or ID"
                placeholder="https://... or room ID"
                value={joinUrl}
                onChange={e => setJoinUrl(e.target.value)}
                required
              />
              <Input
                label="Room Code"
                placeholder="Enter the room code"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value)}
                required
              />
              <Input
                label="Your username"
                placeholder="At least 3 characters"
                value={joinUsername}
                onChange={e => setJoinUsername(e.target.value)}
                minLength={3}
                required
              />
              <Button type="submit" size="lg" loading={joining} style={{ marginTop: '4px' }}>
                Join Room →
              </Button>
            </form>
          ) : (
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Input
                label="Room Code"
                placeholder="Choose a secret code"
                value={createCode}
                onChange={e => setCreateCode(e.target.value)}
                required
                hint="Share this code with players who want to join"
              />
              <Input
                label="Your username"
                placeholder="At least 3 characters"
                value={createUsername}
                onChange={e => setCreateUsername(e.target.value)}
                minLength={3}
                required
              />
              <Button type="submit" size="lg" loading={creating} style={{ marginTop: '4px' }}>
                Create Room →
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}