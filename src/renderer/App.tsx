import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Library from './pages/Library';
import AddGame from './pages/AddGame';
import GameDetails from './pages/GameDetails';
import Stats from './pages/Stats';

const App: React.FC = () => {
  console.log('App component rendering...');
  return (
    <div 
      style={{ 
        display: 'flex', 
        height: '100vh', 
        backgroundColor: 'red',
        color: 'white',
        fontSize: '24px',
        padding: '20px'
      }}
    >
      <h1>EARTH LAUNCHER IS WORKING!</h1>
      <p>If you can see this red background and white text, React is rendering correctly.</p>
    </div>
  );
};

export default App; 