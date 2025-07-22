import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Library from './pages/Library';
import AddGame from './pages/AddGame';
import GameDetails from './pages/GameDetails';
import Stats from './pages/Stats';

const App: React.FC = () => {
  return (
    <Router>
      <div className="flex h-screen bg-gray-900">
        <Sidebar />
        <main className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/library" element={<Library />} />
            <Route path="/add-game" element={<AddGame />} />
            <Route path="/game/:gameName" element={<GameDetails />} />
            <Route path="/stats" element={<Stats />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App; 