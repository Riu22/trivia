const KEY = 'trivia-history'

export function saveGame(game, rounds, players, myId) {
  const history = getHistory()
  const entry = {
    id: game.id,
    roomId: game.roomId,
    playedAt: new Date().toISOString(),
    rounds: rounds.length,
    players: players.map(p => ({ id: p.id, username: p.username })),
    myId,
  }
  const updated = [entry, ...history.filter(e => e.id !== game.id)].slice(0, 20)
  localStorage.setItem(KEY, JSON.stringify(updated))
}

export function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

export function clearHistory() {
  localStorage.removeItem(KEY)
}