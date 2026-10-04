import { useState, useEffect } from 'react';
import { Users, Globe, Link as LinkIcon, User } from 'lucide-react';

interface LobbyProps {
  onPlayLocal: () => void;
  onFindMatch: (playerName: string) => void;
  onCreatePrivate: () => void;
}

export function Lobby({ onPlayLocal, onFindMatch, onCreatePrivate }: LobbyProps) {
  const [playerName, setPlayerName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem('playerName');
    if (saved) {
      setPlayerName(saved);
    } else {
      setIsEditingName(true);
    }
  }, []);

  const handleSaveName = () => {
    if (playerName.trim().length > 0) {
      sessionStorage.setItem('playerName', playerName.trim());
      setIsEditingName(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1a2b] text-white flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-900/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-900/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="z-10 text-center mb-8">
        <h1 className="text-6xl md:text-8xl font-bold text-amber-500 tracking-wider uppercase drop-shadow-[0_5px_15px_rgba(245,158,11,0.4)] title-font mb-4">
          Anime Arena
        </h1>
        <p className="text-slate-400 text-lg md:text-xl tracking-widest uppercase font-semibold">
          Strategic Crew Builder
        </p>
      </div>

      <div className="z-10 flex flex-col gap-6 w-full max-w-md">
        
        {/* Name Input Section */}
        {isEditingName ? (
          <div className="bg-[#173f67] p-4 rounded-xl border-2 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
            <label className="block text-amber-400 font-bold mb-2 uppercase tracking-wider text-sm">Enter your Name to Play</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                maxLength={15}
                className="flex-1 bg-[#0b1a2b] border border-slate-600 rounded px-3 py-2 text-white outline-none focus:border-amber-500 transition-colors"
                placeholder="Pirate King"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
              />
              <button 
                onClick={handleSaveName}
                disabled={playerName.trim().length === 0}
                className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold px-4 py-2 rounded transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 bg-[#173f67]/50 p-2 rounded-lg border border-slate-700">
            <User className="w-4 h-4 text-amber-400" />
            <span className="text-slate-300">Playing as <strong className="text-amber-400">{playerName}</strong></span>
            <button onClick={() => setIsEditingName(true)} className="text-xs text-blue-400 hover:underline ml-2">Edit</button>
          </div>
        )}

        <button 
          onClick={onPlayLocal}
          className="group relative w-full flex items-center justify-between p-6 bg-[#173f67] border-2 border-slate-600 rounded-2xl hover:border-amber-500 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all transform hover:-translate-y-1"
        >
          <div className="flex flex-col items-start">
            <span className="text-2xl font-bold text-white mb-1">Play Local</span>
            <span className="text-sm text-slate-400">Pass & Play on the same screen</span>
          </div>
          <Users className="w-8 h-8 text-slate-400 group-hover:text-amber-500 transition-colors" />
        </button>

        <div className="flex items-center gap-4 w-full opacity-80 my-2">
          <div className="flex-1 h-px bg-slate-700"></div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Online Multiplayer</span>
          <div className="flex-1 h-px bg-slate-700"></div>
        </div>

        <button 
          onClick={() => {
            if (!playerName.trim()) setIsEditingName(true);
            else onFindMatch(playerName.trim());
          }}
          className="group relative w-full flex items-center justify-between p-6 bg-gradient-to-r from-amber-600 to-amber-500 border-2 border-amber-400 rounded-2xl shadow-[0_5px_15px_rgba(245,158,11,0.4)] hover:shadow-[0_8px_25px_rgba(245,158,11,0.6)] transition-all transform hover:-translate-y-1"
        >
          <div className="flex flex-col items-start text-left">
            <span className="text-2xl font-bold text-slate-900 mb-1">Find Match</span>
            <span className="text-sm text-amber-900 font-semibold">Play against a random opponent</span>
          </div>
          <Globe className="w-8 h-8 text-slate-900" />
        </button>

        <button 
          onClick={onCreatePrivate}
          className="group relative w-full flex items-center justify-between p-6 bg-[#0d2847] border-2 border-slate-600 rounded-2xl hover:border-blue-400 hover:shadow-[0_0_20px_rgba(96,165,250,0.3)] transition-all transform hover:-translate-y-1"
        >
          <div className="flex flex-col items-start text-left">
            <span className="text-2xl font-bold text-white mb-1">Play with Friend</span>
            <span className="text-sm text-slate-400">Create a private room link</span>
          </div>
          <LinkIcon className="w-8 h-8 text-slate-400 group-hover:text-blue-400 transition-colors" />
        </button>
      </div>

      <div className="absolute bottom-4 text-center w-full text-xs text-slate-600">
        v2.0.0-alpha • Powered by Fastify + WebSockets
      </div>
    </div>
  );
}
