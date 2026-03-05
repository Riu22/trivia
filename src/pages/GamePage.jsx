import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getGame, getRounds, getRoundQuestions, getAnswers, getPlayers, getTeams
} from '../api'
import { useAuth } from '../contexts/AuthContext'
import QuestionCard from '../components/QuestionCard'
import CountdownTimer from '../components/CountdownTimer'
import Scoreboard from '../components/Scoreboard'
import { Badge, Spinner, Button, Card } from '../components/Ui'

function RoundTab({ round, index, active, onClick }) {
  const started = Date.parse(round.createdAt) <= Date.now()
  const ended = Date.parse(round.endedAt) <= Date.now()
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 14px', borderRadius: 'var(--radius)', fontSize: '13px',
        fontWeight: 600, fontFamily: 'var(--font-display)',
        background: active ? 'var(--bg-3)' : 'transparent',
        border: active ? '1px solid var(--border)' : '1px solid transparent',
        color: active ? 'var(--text)' : 'var(--text-3)',
        cursor: 'pointer', transition: 'all var(--transition)',
        display: 'flex', alignItems: 'center', gap: '6px',
      }}
    >
      R{index + 1}
      {ended && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} />}
      {!ended && started && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1.5s ease-in-out infinite', flexShrink: 0 }} />}
      {!started && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-3)', flexShrink: 0 }} />}
    </button>
  )
}

export default function GamePage() {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const { player: me } = useAuth()

  const [game, setGame] = useState(null)
  const [rounds, setRounds] = useState([])
  const [activeRound, setActiveRound] = useState(null)
  const [questions, setQuestions] = useState([])
  const [allAnswers, setAllAnswers] = useState([])
  const [allQuestions, setAllQuestions] = useState([]) // all questions across all rounds for scoreboard
  const [players, setPlayers] = useState([])
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [showScore, setShowScore] = useState(false)
  const [questionsLoading, setQuestionsLoading] = useState(false)
  const [error, setError] = useState(null)
  const activeRoundRef = useRef(null)

  const roundEnded = activeRound && Date.parse(activeRound.endedAt) <= Date.now()
  const roundStarted = activeRound && Date.parse(activeRound.createdAt) <= Date.now() + 2000
  const gameEnded = game?.endedAt && new Date(game.endedAt) <= new Date()

  const loadRound = useCallback(async (round) => {
    if (!round) return
    const now = new Date()
    const started = Date.parse(round.createdAt) <= Date.now() + 2000
    const ended = Date.parse(round.endedAt) <= Date.now()

    setActiveRound(round)
    activeRoundRef.current = round

    if (!started) {
      setQuestions([])
      return
    }

    setQuestionsLoading(true)
    setError(null)
    try {
      const qs = await getRoundQuestions(gameId, round.id)
      setQuestions(qs)
      // Accumulate all questions for scoreboard scoring
      setAllQuestions(prev => {
        const existing = prev.filter(q => !qs.find(nq => nq.id === q.id))
        return [...existing, ...qs]
      })

      if (ended) {
        const answersArrays = await Promise.all(
          qs.map(q => getAnswers(gameId, round.id, q.id).catch(() => []))
        )
        const roundAnswers = answersArrays.flat()
        setAllAnswers(prev => {
          const existing = prev.filter(a => !roundAnswers.find(na => na.id === a.id))
          return [...existing, ...roundAnswers]
        })
      }
    } catch (err) {
      if (err.status === 500) setError('Server error loading questions.')
      setQuestions([])
    } finally {
      setQuestionsLoading(false)
    }
  }, [gameId])

  useEffect(() => {
    async function load() {
      try {
        const g = await getGame(gameId)
        setGame(g)
        const [rs, roomPlayers, roomTeams] = await Promise.all([
          getRounds(gameId),
          getPlayers(g.roomId),
          getTeams(g.roomId),
        ])
        setRounds(rs)
        setPlayers(roomPlayers)
        setTeams(roomTeams)
        if (rs.length > 0) {
          const current = rs.find(r =>
            Date.parse(r.createdAt) <= Date.now() && Date.parse(r.endedAt) > Date.now()
          ) || rs[rs.length - 1]
          await loadRound(current)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [gameId, loadRound])

  // Poll every 3s to detect round transitions
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const rs = await getRounds(gameId)
        setRounds(rs)
        const current = activeRoundRef.current

        if (current) {
          const updated = rs.find(r => r.id === current.id)
          const justEnded = updated &&
            Date.parse(updated.endedAt) <= Date.now() &&
            Date.parse(current.endedAt) > Date.now() - 4000
          if (justEnded) {
            await loadRound(updated)
            return
          }
        }

        const newActive = rs.find(r =>
          Date.parse(r.createdAt) <= Date.now() && Date.parse(r.endedAt) > Date.now()
        )
        if (newActive && (!current || newActive.id !== current.id)) {
          await loadRound(newActive)
        }
      } catch {}
    }, 3000)
    return () => clearInterval(interval)
  }, [gameId, loadRound])

  const myAnswerForQuestion = (questionId) =>
    allAnswers.find(a => a.questionId === questionId && a.playerId === me?.id)

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <Spinner size={32} color="var(--accent)" />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', padding: '24px', maxWidth: '820px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '24px', flexWrap: 'wrap', gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate(`/room/${game?.roomId}`)}
            style={{ color: 'var(--text-3)', fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ← Room
          </button>
          <h1 style={{ fontSize: '18px', fontWeight: 800 }}>Game #{gameId}</h1>
          {gameEnded
            ? <Badge color="default">Ended</Badge>
            : <Badge color="accent">Live</Badge>
          }
        </div>
        <Button
          variant={showScore ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setShowScore(s => !s)}
        >
          {showScore ? '← Questions' : 'Scores →'}
        </Button>
      </div>

      {/* Game ended banner — stays, doesn't redirect */}
      {gameEnded && (
        <div style={{
          marginBottom: '24px', padding: '20px 24px',
          background: 'var(--accent-dim)', border: '1px solid rgba(232,255,71,0.3)',
          borderRadius: 'var(--radius-lg)', textAlign: 'center',
        }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏆</div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent)', marginBottom: '4px' }}>
            Game Over!
          </h2>
          <p style={{ color: 'var(--text-2)', fontSize: '14px', marginBottom: '16px' }}>
            Check the final scores below
          </p>
          <Button onClick={() => setShowScore(true)} size="sm">
            View Final Scores →
          </Button>
        </div>
      )}

      {/* Round tabs */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '4px',
        marginBottom: '24px', borderBottom: '1px solid var(--border)',
        paddingBottom: '16px', overflowX: 'auto',
      }}>
        {rounds.map((r, i) => (
          <RoundTab
            key={r.id} round={r} index={i}
            active={activeRound?.id === r.id}
            onClick={() => loadRound(r)}
          />
        ))}
        {rounds.length === 0 && (
          <span style={{ color: 'var(--text-3)', fontSize: '13px' }}>No rounds yet</span>
        )}
      </div>

      {showScore ? (
        <div className="animate-in">
          <Scoreboard players={players} teams={teams} answers={allAnswers} questions={allQuestions} />
        </div>
      ) : (
        <div className="animate-in">
          {activeRound && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h2 style={{ fontSize: '16px', fontWeight: 700 }}>
                    Round {rounds.findIndex(r => r.id === activeRound.id) + 1}
                  </h2>
                  {roundEnded
                    ? <Badge color="green">Ended</Badge>
                    : roundStarted
                      ? <Badge color="accent">Active</Badge>
                      : <Badge color="default">Upcoming</Badge>
                  }
                </div>
                {roundEnded && (
                  <p style={{ color: 'var(--text-2)', fontSize: '13px', marginTop: '4px' }}>
                    Correct answers are now revealed
                  </p>
                )}
              </div>
              {roundStarted && !roundEnded && (
                <CountdownTimer endsAt={activeRound.endedAt} totalSeconds={
                  Math.round((new Date(activeRound.endedAt) - new Date(activeRound.createdAt)) / 1000)
                } />
              )}
            </div>
          )}

          {questionsLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
              <Spinner size={24} color="var(--accent)" />
            </div>
          ) : !roundStarted ? (
            <div style={{ textAlign: 'center', padding: '64px 24px', color: 'var(--text-3)' }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>⏳</div>
              <p style={{ fontSize: '15px' }}>Waiting for this round to start…</p>
              {activeRound && (
                <p style={{ fontSize: '13px', marginTop: '8px', fontFamily: 'var(--font-mono)' }}>
                  Starts at {new Date(activeRound.createdAt).toLocaleTimeString()}
                </p>
              )}
            </div>
          ) : questions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {questions.map((q, i) => (
                <div key={q.id}>
                  <div style={{
                    fontSize: '11px', color: 'var(--text-3)', marginBottom: '8px',
                    fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em',
                  }}>
                    Question {i + 1} of {questions.length}
                  </div>
                  <QuestionCard
                    question={q}
                    gameId={gameId}
                    roundId={activeRound.id}
                    roundEnded={roundEnded}
                    myAnswer={myAnswerForQuestion(q.id)}
                  />
                </div>
              ))}

              {/* Between rounds: show who answered what */}
              {roundEnded && allAnswers.length > 0 && (
                <Card style={{ marginTop: '8px' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    All Players' Answers
                  </h3>
                  {questions.map(q => {
                    const qAnswers = allAnswers.filter(a => a.questionId === q.id)
                    if (!qAnswers.length) return (
                      <div key={q.id} style={{ marginBottom: '16px' }}>
                        <p style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '6px', fontWeight: 600 }}>
                          {q.question}
                        </p>
                        <p style={{ fontSize: '12px', color: 'var(--text-3)' }}>No answers submitted</p>
                      </div>
                    )
                    return (
                      <div key={q.id} style={{ marginBottom: '20px' }}>
                        <p style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '8px', fontWeight: 600 }}>
                          {q.question}
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {qAnswers.map(a => {
                            const p = players.find(pl => pl.id === a.playerId)
                            const correct = q.correctAnswers?.length > 0 &&
                              q.correctAnswers.map(ca => ca.toLowerCase().trim())
                                .includes(a.answer?.toLowerCase().trim())
                            return (
                              <div key={a.id} style={{
                                display: 'flex', alignItems: 'center', gap: '10px',
                                padding: '8px 12px', borderRadius: 'var(--radius)',
                                background: q.correctAnswers?.length === 0
                                  ? 'var(--bg-2)'
                                  : correct ? 'var(--green-dim)' : 'var(--red-dim)',
                                border: `1px solid ${q.correctAnswers?.length === 0
                                  ? 'var(--border)'
                                  : correct ? 'rgba(71,255,138,0.2)' : 'rgba(255,71,71,0.2)'}`,
                              }}>
                                <div style={{
                                  width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                                  background: `hsl(${((p?.username || '?').charCodeAt(0) * 37) % 360}, 40%, 30%)`,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: '10px', fontWeight: 700,
                                }}>
                                  {(p?.username || '?')[0].toUpperCase()}
                                </div>
                                <span style={{ fontSize: '12px', color: 'var(--text-2)', minWidth: '80px' }}>
                                  {p?.username || `Player ${a.playerId}`}
                                </span>
                                <span style={{ fontSize: '13px', fontWeight: 500, flex: 1,
                                  color: q.correctAnswers?.length === 0
                                    ? 'var(--text)'
                                    : correct ? 'var(--green)' : 'var(--red)'
                                }}>
                                  {a.answer}
                                </span>
                                {q.correctAnswers?.length > 0 && (
                                  <span style={{ fontSize: '16px' }}>{correct ? '✓' : '✗'}</span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </Card>
              )}
            </div>
          ) : error ? (
            <div style={{
              textAlign: 'center', padding: '48px 24px',
              background: 'var(--red-dim)', border: '1px solid rgba(255,71,71,0.2)',
              borderRadius: 'var(--radius-lg)',
            }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚠️</div>
              <p style={{ color: 'var(--red)', fontWeight: 600 }}>Error loading questions</p>
              <p style={{ color: 'var(--text-2)', fontSize: '13px' }}>{error}</p>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '64px 24px', color: 'var(--text-3)' }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>❓</div>
              <p>No questions available for this round</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}