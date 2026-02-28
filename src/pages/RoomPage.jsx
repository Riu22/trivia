import { useParams, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { RoomProvider } from '../contexts/RoomContext'
import LobbyPage from './LobbyPage'

export default function RoomPage() {
  const { roomId } = useParams()
  const { player } = useAuth()
  const navigate = useNavigate()

  if (!player) return <Navigate to="/" replace />

  return (
    <RoomProvider roomId={Number(roomId)} onRoomDeleted={() => navigate('/')} onKicked={() => navigate('/?kicked=1')}>
      <LobbyPage />
    </RoomProvider>
  )
}