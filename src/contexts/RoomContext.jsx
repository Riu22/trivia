import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { subscribeToRoom, getRoom, getPlayers, getTeams } from '../api'

const RoomContext = createContext(null)

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

export function RoomProvider({ roomId, onRoomDeleted, onKicked, children }) {
  const { player } = useAuth()
  const [room, setRoom] = useState(null)
  const [players, setPlayers] = useState([])
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const pollRef = useRef(null)
  const esRef = useRef(null)
  const mountedRef = useRef(true)

  const refresh = useCallback(async () => {
    if (!roomId || !mountedRef.current) return
    try {
      const [r, p, t] = await Promise.all([
        getRoom(roomId),
        getPlayers(roomId),
        getTeams(roomId),
      ])
      if (!mountedRef.current) return
      setRoom(r)
      setPlayers(p)
      setTeams(t)

      if (player && !p.find(pl => pl.id === player.id)) {
        onKicked?.()
      }
    } catch (e) {
      console.error('refresh error', e)
    }
  }, [roomId])

  useEffect(() => {
    if (!roomId) return
    setLoading(true)
    refresh().finally(() => setLoading(false))
  }, [roomId, refresh])

  useEffect(() => {
    if (!roomId || !player) return
    mountedRef.current = true

    function startPolling() {
      if (pollRef.current) return
      console.log('[SSE] Starting polling fallback')
      pollRef.current = setInterval(() => {
        if (mountedRef.current) refresh()
      }, 2000)
    }

    function stopPolling() {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }

    function connect() {
      if (esRef.current) {
        esRef.current.close()
        esRef.current = null
      }

      console.log('[SSE] Connecting...')
      const es = subscribeToRoom(roomId, (event) => {
        if (!mountedRef.current) return

        if (event?.type === 'error') {
          console.log('[SSE] Error, falling back to polling')
          setConnected(false)
          startPolling()
          return
        }

        console.log('[SSE] Event received:', event?.type, event?.data)
        setConnected(true)

        if (event?.type === 'room-deleted') {
          onRoomDeleted?.()
          return
        }

        refresh()
      })

      es.onopen = () => {
        console.log('[SSE] Connected!')
        setConnected(true)
      }

      es.onerror = (err) => {
        console.log('[SSE] Connection error, starting polling fallback', err)
        setConnected(false)
        startPolling()
      }

      esRef.current = es
    }

    connect()

    startPolling()

    return () => {
      mountedRef.current = false
      esRef.current?.close()
      esRef.current = null
      stopPolling()
      setConnected(false)
    }
  }, [roomId, player, refresh, onRoomDeleted])

  useEffect(() => {
    return () => { mountedRef.current = false }
  }, [])

  return (
    <RoomContext.Provider value={{ room, players, teams, loading, connected, refresh }}>
      {children}
    </RoomContext.Provider>
  )
}

export const useRoom = () => useContext(RoomContext)