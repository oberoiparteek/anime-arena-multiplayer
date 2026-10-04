import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Lobby } from './Lobby.tsx'
import { useGameStore } from './stores/gameStore.ts'

function Root() {
  const { isOnline, matchmakingStatus, quitOnline } = useGameStore();

  if (isOnline) {
    return (
      <div className="relative">
        <button 
          onClick={quitOnline}
          className="absolute top-4 left-4 z-50 bg-red-900/80 text-white px-4 py-2 rounded-lg border border-red-500 hover:bg-red-800 font-bold uppercase text-xs"
        >
          ← Surrender
        </button>
        <App />
      </div>
    );
  }

  if (matchmakingStatus === 'searching') {
    return (
      <div className="min-h-screen bg-[#0b1a2b] text-white flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-8"></div>
        <h2 className="text-3xl font-bold title-font tracking-wider text-amber-500 animate-pulse">Searching for Opponent...</h2>
        <button 
          onClick={quitOnline}
          className="mt-8 text-slate-400 hover:text-white underline text-sm"
        >
          Cancel
        </button>
      </div>
    );
  }

  return <LobbyManager />;
}

function LobbyManager() {
  const [view, setView] = useState<'lobby' | 'local'>('lobby');
  const { findMatch, initializeLocal } = useGameStore();

  if (view === 'local') {
    return (
      <div className="relative">
        <button 
          onClick={() => setView('lobby')}
          className="absolute top-4 left-4 z-50 bg-slate-800 text-white px-4 py-2 rounded-lg border border-slate-600 hover:bg-slate-700 font-bold uppercase text-xs"
        >
          ← Quit Local
        </button>
        <App />
      </div>
    );
  }

  return (
    <Lobby 
      onPlayLocal={() => {
        initializeLocal();
        setView('local');
      }} 
      onFindMatch={(playerName) => {
        findMatch(playerName);
      }}
      onCreatePrivate={() => {
        alert("Private rooms coming in Phase 3!");
      }}
    />
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
