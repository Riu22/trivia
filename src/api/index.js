const BASE = import.meta.env.VITE_API_URL || '/api'

function getToken() {
  return localStorage.getItem('trivia_token')
}

async function request(method, path, body) {
  const token = getToken()
  const sep = path.includes('?') ? '&' : '?'
  const url = token
    ? `${BASE}${path}${sep}token=${token}`
    : `${BASE}${path}`

  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  })

  if (res.status === 204) return null
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw Object.assign(new Error(text || res.statusText), { status: res.status })
  }
  return res.json()
}

const get = (path) => request('GET', path)
const post = (path, body) => request('POST', path, body)
const put = (path, body) => request('PUT', path, body)
const del = (path) => request('DELETE', path)

// ── Rooms ──────────────────────────────────────────────
export const createRoom = (code) => post('/rooms', { code })
export const getRoom = (roomId) => get(`/rooms/${roomId}`)
export const deleteRoom = (roomId) => del(`/rooms/${roomId}`)

// ── Players ────────────────────────────────────────────
export const joinRoom = (roomId, code, username) =>
  post(`/rooms/${roomId}/players`, { code, username })
export const getPlayers = (roomId) => get(`/rooms/${roomId}/players`)
export const getPlayer = (roomId, playerId) => get(`/rooms/${roomId}/players/${playerId}`)
export const deletePlayer = (roomId, playerId) => del(`/rooms/${roomId}/players/${playerId}`)

// ── Teams ──────────────────────────────────────────────
export const createTeam = (roomId) => post(`/rooms/${roomId}/teams`)
export const getTeams = (roomId) => get(`/rooms/${roomId}/teams`)
export const deleteTeam = (roomId, teamId) => del(`/rooms/${roomId}/teams/${teamId}`)
export const assignPlayerToTeam = (roomId, teamId, playerId) =>
  put(`/rooms/${roomId}/teams/${teamId}/players/${playerId}`)
export const removePlayerFromTeam = (roomId, teamId, playerId) =>
  del(`/rooms/${roomId}/teams/${teamId}/players/${playerId}`)

// ── Games ──────────────────────────────────────────────
export const createGame = (roomId, config) => post('/games', { roomId, ...config })
export const getGame = (gameId) => get(`/games/${gameId}`)
export const getGames = (roomId) => get(`/games?roomId=${roomId}`)
export const deleteGame = (gameId) => del(`/games/${gameId}`)

// ── Rounds ─────────────────────────────────────────────
export const getRounds = (gameId) => get(`/games/${gameId}/rounds`)
export const getRound = (gameId, roundId) => get(`/games/${gameId}/rounds/${roundId}`)

// ── Questions ──────────────────────────────────────────
export const getRoundQuestions = (gameId, roundId) =>
  get(`/games/${gameId}/rounds/${roundId}/questions`)

// ── Answers ────────────────────────────────────────────
export const submitAnswer = (gameId, roundId, questionId, answer) =>
  post(`/games/${gameId}/rounds/${roundId}/questions/${questionId}`, { answer })
export const getAnswers = (gameId, roundId, questionId) =>
  get(`/games/${gameId}/rounds/${roundId}/questions/${questionId}`)
export const getPlayerAnswer = (gameId, roundId, questionId, playerId) =>
  get(`/games/${gameId}/rounds/${roundId}/questions/${questionId}/players/${playerId}`)

// ── SSE ────────────────────────────────────────────────
// The backend sends named events (event: player-joined, player-left, etc.)
// We must use addEventListener for each event type, not onmessage
const SSE_EVENTS = [
  'player-joined',
  'player-left',
  'player-assigned-to-team',
  'player-removed-from-team',
  'team-created',
  'team-deleted',
  'game-created',
  'game-deleted',
  'player-submitted-answer',
  'room-deleted',
]

export function subscribeToRoom(roomId, onEvent) {
  const token = getToken()
  const url = `${BASE}/rooms/${roomId}/events${token ? `?token=${token}` : ''}`
  const es = new EventSource(url)

  // Listen to each named event type
  SSE_EVENTS.forEach(eventType => {
    es.addEventListener(eventType, (e) => {
      try {
        onEvent({ type: eventType, data: JSON.parse(e.data) })
      } catch {
        onEvent({ type: eventType, data: e.data })
      }
    })
  })

  // Also listen to generic messages as fallback
  es.onmessage = (e) => {
    try { onEvent({ type: 'message', data: JSON.parse(e.data) }) } catch { onEvent({ type: 'message', data: e.data }) }
  }

  es.onerror = () => onEvent({ type: 'error' })

  return es
}