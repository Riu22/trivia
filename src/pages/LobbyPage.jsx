import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRoom } from '../contexts/RoomContext'
import { useAuth } from '../contexts/AuthContext'
import {
  createTeam, deleteTeam,
  assignPlayerToTeam, removePlayerFromTeam,
  deletePlayer, createGame
} from '../api'
import { Button, Badge, Spinner, Modal, Input, toast, Card } from '../components/Ui'

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={copy}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '6px 12px', borderRadius: 'var(--radius)',
        background: copied ? 'var(--accent-dim)' : 'var(--bg-3)',
        border: `1px solid ${copied ? 'rgba(232,255,71,0.3)' : 'var(--border)'}`,
        color: copied ? 'var(--accent)' : 'var(--text-2)',
        fontSize: '12px', fontFamily: 'var(--font-mono)',
        cursor: 'pointer', transition: 'all var(--transition)',
      }}
    >
      {copied ? '✓ Copied' : '⎘ Copy URL'}
    </button>
  )
}

function PlayerTag({ player, isHost, isMe, teams, canKick, onKick }) {
  const team = teams.find(t => String(t.id) === String(player.teamId))
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '10px 14px',
      background: isMe ? 'var(--accent-dim2)' : 'transparent',
      border: `1px solid ${isMe ? 'rgba(232,255,71,0.15)' : 'var(--border)'}`,
      borderRadius: 'var(--radius)',
      transition: 'all 0.2s ease',
    }}>
      <div style={{
        width: '32px', height: '32px', borderRadius: '50%',
        background: `hsl(${(player.username.charCodeAt(0) * 37) % 360}, 40%, 30%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '13px', fontWeight: 700, color: 'var(--text)',
        flexShrink: 0,
      }}>
        {player.username[0].toUpperCase()}
      </div>
      <span style={{ flex: 1, fontSize: '14px', fontWeight: 500 }}>{player.username}</span>
      {isMe && <Badge color="accent">You</Badge>}
      {isHost && <Badge color="default">Host</Badge>}
      {team && <Badge color="blue">Team {team.id}</Badge>}
      {canKick && (
        <button
          onClick={onKick}
          title="Kick player"
          style={{
            color: 'var(--text-3)', fontSize: '16px', background: 'none',
            border: 'none', cursor: 'pointer', lineHeight: 1, padding: '2px 4px',
            borderRadius: '4px', transition: 'color var(--transition)',
          }}
          onMouseEnter={e => e.target.style.color = 'var(--red)'}
          onMouseLeave={e => e.target.style.color = 'var(--text-3)'}
        >
          ×
        </button>
      )}
    </div>
  )
}

export default function LobbyPage() {
  const navigate = useNavigate()
  const { room, players, teams, loading, connected, refresh } = useRoom()
  const { player: me } = useAuth()

  const [showGameConfig, setShowGameConfig] = useState(false)
  const [gameConfig, setGameConfig] = useState({ rounds: 3, timePerRound: 60, questionsPerRound: 5 })
  const [starting, setStarting] = useState(false)

  const isHost = room && me && room.hostId === me.id
  const hasGame = !!room?.gameId
  const myTeamId = players.find(p => p.id === me?.id)?.teamId

  async function handleCreateTeam() {
    if (hasGame) { toast('Cannot create teams during an active game', 'error'); return }
    try {
      await createTeam(room.id)
      refresh()
    } catch (e) {
      toast(e.status === 409 ? 'Cannot create teams during an active game' : 'Failed to create team', 'error')
    }
  }

  async function handleDeleteTeam(teamId) {
    if (hasGame) { toast('Cannot delete teams during an active game', 'error'); return }
    try {
      await deleteTeam(room.id, teamId)
      refresh()
    } catch (e) {
      toast(e.status === 409 ? 'Cannot delete teams during an active game' : 'Failed to delete team', 'error')
    }
  }

  async function handleJoinTeam(teamId) {
    if (hasGame) { toast('Cannot change teams during an active game', 'error'); return }
    try {
      await assignPlayerToTeam(room.id, teamId, me.id)
      refresh()
    } catch (e) {
      toast('Failed to join team', 'error')
    }
  }

  async function handleLeaveTeam(teamId) {
    if (hasGame) { toast('Cannot change teams during an active game', 'error'); return }
    try {
      await removePlayerFromTeam(room.id, teamId, me.id)
      refresh()
    } catch (e) {
      toast('Failed to leave team', 'error')
    }
  }

  async function handleAssign(teamId, playerId) {
    if (hasGame) { toast('Cannot assign players during an active game', 'error'); return }
    try {
      await assignPlayerToTeam(room.id, teamId, playerId)
      refresh()
    } catch (e) {
      toast(e.status === 409 ? 'Cannot assign players during an active game' : 'Failed to assign player', 'error')
    }
  }

  async function handleRemoveFromTeam(teamId, playerId) {
    if (hasGame) { toast('Cannot modify teams during an active game', 'error'); return }
    try {
      await removePlayerFromTeam(room.id, teamId, playerId)
      refresh()
    } catch (e) {
      toast(e.status === 409 ? 'Cannot modify teams during an active game' : 'Failed to remove player', 'error')
    }
  }

  async function handleLeave() {
    const amHost = room?.hostId === me?.id
    const otherPlayers = players.filter(p => p.id !== me?.id)
    if (amHost && otherPlayers.length > 0) {
      toast('You are the host. Kick all other players before leaving.', 'error')
      return
    }
    if (!window.confirm('Are you sure you want to leave the room?')) return
    try { await deletePlayer(room.id, me.id) } catch (e) { console.warn('deletePlayer failed:', e) }
    navigate('/')
  }

  async function handleKick(playerId) {
    try {
      await deletePlayer(room.id, playerId)
      refresh()
    } catch (e) {
      toast(e.status === 403 ? 'Only the host can kick players' : 'Failed to kick player', 'error')
    }
  }

  async function handleStartGame(e) {
    e.preventDefault()
    setStarting(true)
    try {
      const game = await createGame(room.id, {
        rounds: Number(gameConfig.rounds),
        timePerRound: Number(gameConfig.timePerRound),
        questionsPerRound: Number(gameConfig.questionsPerRound),
      })
      setShowGameConfig(false)
      navigate(`/game/${game.id}`)
      refresh()
    } catch (err) {
      toast(
        err.status === 409 ? 'A game is already running in this room'
        : err.status === 400 ? 'Not enough questions in the database'
        : err.message || 'Failed to start game',
        'error'
      )
    } finally {
      setStarting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <Spinner size={32} color="var(--accent)" />
      </div>
    )
  }

  const roomUrl = window.location.origin + `/room/${room?.id}`

  return (
    <div style={{ minHeight: '100vh', padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div className="lobby-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Room #{room?.id}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{
                width: '7px', height: '7px', borderRadius: '50%',
                background: connected ? 'var(--green)' : 'var(--text-3)',
                animation: connected ? 'pulse 2s ease-in-out infinite' : 'none',
              }} />
              <span style={{ fontSize: '11px', color: connected ? 'var(--green)' : 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                {connected ? 'live' : 'connecting…'}
              </span>
            </div>
            {hasGame && <Badge color="blue">Game active</Badge>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--text-3)', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
              {roomUrl}
            </span>
            <CopyButton text={roomUrl} />
          </div>
        </div>

        <div className="lobby-actions">
          <Button variant="ghost" size="sm" onClick={handleLeave} style={{ color: 'var(--text-3)' }}>
            Leave
          </Button>
          {hasGame ? (
            <Button onClick={() => navigate(`/game/${room.gameId}`)}>
              Go to Game →
            </Button>
          ) : isHost ? (
            <Button onClick={() => setShowGameConfig(true)}>
              Start Game →
            </Button>
          ) : (
            <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>
              {!myTeamId && teams.length > 0
                ? <span style={{ color: 'var(--red)', fontWeight: 600 }}>⚠ Join a team to play</span>
                : 'Waiting for host to start…'
              }
            </div>
          )}
        </div>
      </div>

      <div className="grid-2">
        {/* Players */}
        <div>
          <div style={{ marginBottom: '12px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Players · {players.length}
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {players.map(p => (
              <PlayerTag
                key={p.id}
                player={p}
                isHost={p.id === room?.hostId}
                isMe={p.id === me?.id}
                teams={teams}
                canKick={isHost && p.id !== me?.id && !hasGame}
                onKick={() => handleKick(p.id)}
              />
            ))}
            {players.length === 0 && (
              <p style={{ color: 'var(--text-3)', fontSize: '13px' }}>No players yet</p>
            )}
          </div>
        </div>

        {/* Teams */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Teams · {teams.length}
            </h2>
            {isHost && !hasGame && (
              <button
                onClick={handleCreateTeam}
                style={{
                  fontSize: '12px', color: 'var(--accent)', fontFamily: 'var(--font-display)',
                  fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer',
                }}
              >
                + New Team
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {teams.map(team => {
              const teamPlayers = players.filter(p => String(p.teamId) === String(team.id))
              const unassigned = players.filter(p => !p.teamId)
              const isMyTeam = String(myTeamId) === String(team.id)

              return (
                <div key={team.id} style={{
                  background: isMyTeam ? 'var(--blue-dim)' : 'var(--bg-2)',
                  border: `1px solid ${isMyTeam ? 'rgba(71,179,255,0.3)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius)',
                  padding: '14px',
                  transition: 'all var(--transition)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontWeight: 600, fontSize: '14px' }}>
                      Team {team.id}
                      {isMyTeam && <span style={{ marginLeft: '8px', fontSize: '11px', color: 'var(--blue)' }}>← you</span>}
                    </span>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      {/* Any player can join/leave a team */}
                      {!hasGame && (
                        isMyTeam ? (
                          <button
                            onClick={() => handleLeaveTeam(team.id)}
                            style={{
                              fontSize: '11px', padding: '3px 8px', borderRadius: '4px',
                              background: 'var(--red-dim)', border: '1px solid rgba(255,71,71,0.3)',
                              color: 'var(--red)', cursor: 'pointer', fontFamily: 'var(--font-display)',
                              fontWeight: 600,
                            }}
                          >
                            Leave
                          </button>
                        ) : (
                          <button
                            onClick={() => handleJoinTeam(team.id)}
                            style={{
                              fontSize: '11px', padding: '3px 8px', borderRadius: '4px',
                              background: 'var(--accent-dim)', border: '1px solid rgba(232,255,71,0.3)',
                              color: 'var(--accent)', cursor: 'pointer', fontFamily: 'var(--font-display)',
                              fontWeight: 600,
                            }}
                          >
                            Join
                          </button>
                        )
                      )}
                      {isHost && !hasGame && (
                        <button
                          onClick={() => handleDeleteTeam(team.id)}
                          style={{ color: 'var(--text-3)', fontSize: '18px', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: teamPlayers.length ? '8px' : 0 }}>
                    {teamPlayers.map(p => (
                      <div key={p.id} style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '6px 8px', borderRadius: '6px',
                        background: 'var(--bg-3)',
                      }}>
                        <span style={{ fontSize: '13px', flex: 1 }}>{p.username}</span>
                        {isHost && !hasGame && p.id !== me?.id && (
                          <button
                            onClick={() => handleRemoveFromTeam(team.id, p.id)}
                            style={{ color: 'var(--text-3)', fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer' }}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    {teamPlayers.length === 0 && (
                      <p style={{ fontSize: '12px', color: 'var(--text-3)', padding: '4px 0' }}>Empty</p>
                    )}
                  </div>

                  {/* Host can assign unassigned players */}
                  {isHost && !hasGame && unassigned.filter(p => p.id !== me?.id || !myTeamId).length > 0 && (
                    <div>
                      <p style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '6px' }}>Add player:</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {unassigned.map(p => (
                          <button
                            key={p.id}
                            onClick={() => handleAssign(team.id, p.id)}
                            style={{
                              padding: '4px 10px', borderRadius: '6px', fontSize: '12px',
                              background: 'var(--bg-1)', border: '1px solid var(--border)',
                              color: 'var(--text-2)', cursor: 'pointer',
                              fontFamily: 'var(--font-display)',
                              transition: 'all var(--transition)',
                            }}
                          >
                            {p.username}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            {teams.length === 0 && (
              <p style={{ color: 'var(--text-3)', fontSize: '13px' }}>
                {isHost && !hasGame ? 'Create teams to assign players' : 'No teams yet'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Game config modal */}
      <Modal open={showGameConfig} onClose={() => setShowGameConfig(false)} title="Configure Game">
        <form onSubmit={handleStartGame} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Number of Rounds"
            type="number" min="1" max="20"
            value={gameConfig.rounds}
            onChange={e => setGameConfig(g => ({ ...g, rounds: e.target.value }))}
          />
          <Input
            label="Time per Round (seconds)"
            type="number" min="10" max="300"
            value={gameConfig.timePerRound}
            onChange={e => setGameConfig(g => ({ ...g, timePerRound: e.target.value }))}
          />
          <Input
            label="Questions per Round"
            type="number" min="1" max="20"
            value={gameConfig.questionsPerRound}
            onChange={e => setGameConfig(g => ({ ...g, questionsPerRound: e.target.value }))}
          />
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <Button variant="secondary" type="button" onClick={() => setShowGameConfig(false)} style={{ flex: 1 }}>
              Cancel
            </Button>
            <Button type="submit" loading={starting} style={{ flex: 1 }}>
              Start Game →
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}