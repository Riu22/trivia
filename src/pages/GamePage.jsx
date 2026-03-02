import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getGame, getRounds, getRoundQuestions, getAnswers, getPlayers, getTeams
} from '../api'
import { useAuth } from '../contexts/AuthContext'
import QuestionCard from '../components/QuestionCard'
import CountdownTimer from '../components/CountdownTimer'
import Scoreboard from '../components/Scoreboard'
import { Badge, Spinner, Button, Card, toast } from '../components/Ui'
import { saveGame } from '../utils/history'

function RoundTab({ round, index, active, onClick }) {
  const now = new Date()
  const started = new Date(round.createdAt) <= now
  const ended = new Date(round.endedAt) <= now

  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 14px',
        borderRadius: 'var(--radius)',
        fontSize: '13px',
        fontWeight: 600,
        fontFamily: 'var(--font-display)',
        background: active ? 'var(--bg-3)' : 'transparent',
        border: active ? '1px solid var(--border-active)' : '1px solid transparent',
        color: active ? 'var(--text)' : 'var(--text-3)',
        cursor: 'pointer',
        transition: 'all var(--transition)',
        display: 'flex', alignItems: 'center', gap: '6px',
      }}
    >
      R{index + 1}
      {ended && (
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} />
      )}
      {!ended && started && (
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1.5s ease-in-out infinite', flexShrink: 0 }} />
      )}
      {!started && (
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-3)', flexShrink: 0 }} />
      )}
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
  const [players, setPlayers] = useState([])
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [showScore, setShowScore] = useState(false)
  const [questionsLoading, setQuestionsLoading] = useState(false)
  const activeRoundRef = useRef(null)
  const savedRef = useRef(false)

  const roundEnded = activeRound && new Date(activeRound.endedAt) <= new Date()
  const roundStarted = activeRound && new Date(activeRound.createdAt) <= new Date()

  useEffect(() => {
    if (game?.endedAt && new Date(game.endedAt) <= new Date()) {
      if (!savedRef.current) {
        savedRef.current = true
        saveGame(game, rounds, players, me?.id)
      }
      toast('Partida finalizada', 'info')
      const timer = setTimeout(() => {
        const p = JSON.parse(localStorage.getItem('player') || '{}')
        localStorage.setItem('player', JSON.stringify({ ...p, roomId: null, teamId: null }))
        navigate('/')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [game?.endedAt, navigate, rounds, players, me?.id])

  const loadRound = useCallback(async (round) => {
    if (!round) return
    const now = new Date()
    const started = new Date(round.createdAt) <= now
    const ended = new Date(round.endedAt) <= now

    setActiveRound(round)
    activeRoundRef.current = round

    if (!started) {
      setQuestions([])
      return
    }

    setQuestionsLoading(true)
    try {
      const qs = await getRoundQuestions(gameId, round.id)
      setQuestions(qs)

      if (ended) {
        const answersArrays = await Promise.all(
          qs.map(q => getAnswers(gameId, round.id, q.id).catch(() => []))
        )
        setAllAnswers(answersArrays.flat())
      } else {
        setAllAnswers([])
      }
    } catch {
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
          const now = new Date()
          const current = rs.find(r =>
            new Date(r.createdAt) <= now && new Date(r.endedAt) > now
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

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const updatedGame = await getGame(gameId)
        setGame(updatedGame)

        const rs = await getRounds(gameId)
        setRounds(rs)

        const now = new Date()
        const current = activeRoundRef.current

        if (current) {
          const updated = rs.find(r => r.id === current.id)
          if (updated && new Date(updated.endedAt) <= now && new Date(current.endedAt) > now - 4000) {
            await loadRound(updated)
            return
          }
        }

        const newActive = rs.find(r => new Date(r.createdAt) <= now && new Date(r.endedAt) > now)
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

  const gameEnded = game?.endedAt && new Date(game.endedAt) <= new Date()

  return (
    <div style={{ minHeight: '100vh', padding: '24px', maxWidth: '820px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate(`/room/${game?.roomId}`)} style={{ color: 'var(--text-3)', fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer' }}>
            ← Room
          </button>
          <h1 style={{ fontSize: '18px', fontWeight: 800 }}>Game #{gameId}</h1>
          {gameEnded ? <Badge color="default">Ended</Badge> : <Badge color="accent">Live</Badge>}
        </div>
        <Button variant={showScore ? 'primary' : 'secondary'} size="sm" onClick={() => setShowScore(s => !s)}>
          {showScore ? '← Questions' : 'Scores →'}
        </Button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '16px', overflowX: 'auto' }}>
        {rounds.map((r, i) => (
          <RoundTab key={r.id} round={r} index={i} active={activeRound?.id === r.id} onClick={() => loadRound(r)} />
        ))}
      </div>

      {showScore ? (
        <Scoreboard players={players} teams={teams} answers={allAnswers} />
      ) : (
        <div>
          {activeRound && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 700 }}>Round {rounds.findIndex(r => r.id === activeRound.id) + 1}</h2>
                {roundEnded ? <Badge color="green">Ended</Badge> : roundStarted ? <Badge color="accent">Active</Badge> : <Badge color="default">Upcoming</Badge>}
              </div>
              {roundStarted && !roundEnded && (
                <CountdownTimer
                  endsAt={activeRound.endedAt}
                  totalSeconds={Math.round((new Date(activeRound.endedAt) - new Date(activeRound.createdAt)) / 1000)}
                />
              )}
            </div>
          )}

          {questionsLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
              <Spinner size={24} color="var(--accent)" />
            </div>
          ) : !roundStarted ? (
            <div style={{ textAlign: 'center', padding: '64px 24px', color: 'var(--text-3)' }}>
              <p>Waiting for round…</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {questions.map(q => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  gameId={gameId}
                  roundId={activeRound.id}
                  roundEnded={roundEnded}
                  myAnswer={myAnswerForQuestion(q.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}