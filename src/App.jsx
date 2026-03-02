import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ToastContainer } from './components/Ui'
import HomePage from './pages/HomePage'
import RoomPage from './pages/RoomPage'
import GamePage from './pages/GamePage'
import NotFoundPage from './pages/NotFoundPage'
import HistoryPage from './pages/HistoryPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/room/:roomId" element={<RoomPage />} />
          <Route path="/game/:gameId" element={<GamePage />} />
          <Route path="*" element={<NotFoundPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
        <ToastContainer />
      </AuthProvider>
    </BrowserRouter>
  )
}