// src/App.jsx
import './App.css'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import Home from './components/Home'
import Callback from './components/Callback'
import Chat from './components/Chat'

function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/callback"
          element={<Callback />}
        />
        <Route
          path="/chat"
          element={<Chat />}
        />
        <Route
          path="/"
          element={<Home />}
        />
      </Routes>
    </Router>
  )
}

export default App
