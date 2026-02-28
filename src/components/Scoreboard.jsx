import { Badge } from './Ui'

export default function Scoreboard({ players, teams, answers }) {
  const playerScores = {}
  const teamScores = {}

  players.forEach(p => { playerScores[p.id] = 0 })
  teams.forEach(t => { teamScores[t.id] = 0 })

  answers.forEach(a => {

    if (a.playerId && playerScores[a.playerId] !== undefined) {
      playerScores[a.playerId]++
    }
    if (a.teamId && teamScores[a.teamId] !== undefined) {
      teamScores[a.teamId]++
    }
  })

  const sortedPlayers = [...players].sort((a, b) => (playerScores[b.id] || 0) - (playerScores[a.id] || 0))
  const sortedTeams = teams.length > 0
    ? [...teams].sort((a, b) => (teamScores[b.id] || 0) - (teamScores[a.id] || 0))
    : []

  const maxScore = Math.max(1, ...sortedPlayers.map(p => playerScores[p.id] || 0))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {sortedTeams.length > 0 && (
        <div>
          <h3 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
            Team Scores
          </h3>
          {sortedTeams.map((team, i) => {
            const score = teamScores[team.id] || 0
            const pct = (score / maxScore) * 100
            return (
              <div key={team.id} style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {i === 0 && score > 0 && <span>🏆</span>}
                    <span style={{ fontWeight: 600, fontSize: '14px' }}>Team {team.id}</span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontSize: '14px' }}>
                    {score} pts
                  </span>
                </div>
                <div style={{ height: '4px', background: 'var(--bg-3)', borderRadius: '2px' }}>
                  <div style={{
                    height: '100%',
                    width: `${pct}%`,
                    background: i === 0 ? 'var(--accent)' : 'var(--blue)',
                    borderRadius: '2px',
                    transition: 'width 0.6s ease',
                  }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div>
        <h3 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
          Player Scores
        </h3>
        {sortedPlayers.map((player, i) => {
          const score = playerScores[player.id] || 0
          const pct = (score / maxScore) * 100
          return (
            <div key={player.id} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-3)', fontSize: '12px', width: '16px' }}>
                    {i + 1}
                  </span>
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%',
                    background: `hsl(${(player.username.charCodeAt(0) * 37) % 360}, 40%, 30%)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '10px', fontWeight: 700,
                  }}>
                    {player.username[0].toUpperCase()}
                  </div>
                  <span style={{ fontWeight: 500, fontSize: '14px' }}>{player.username}</span>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-2)', fontSize: '13px' }}>
                  {score} pts
                </span>
              </div>
              <div style={{ height: '3px', background: 'var(--bg-3)', borderRadius: '2px' }}>
                <div style={{
                  height: '100%',
                  width: `${pct}%`,
                  background: 'var(--text-3)',
                  borderRadius: '2px',
                  transition: 'width 0.6s ease',
                }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}