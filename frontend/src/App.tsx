import { useState, useEffect } from 'react';
import { useGameStore } from './stores/gameStore';
import { Shield } from 'lucide-react';
import CARDS from '../../packages/game-engine/src/seed.json';

function App() {
  const { phase, currentPlayer, players, cardPool, draw, place, skip, isOnline, myPlayerIndex, opponentName } = useGameStore();

  const p1 = players[1];
  const p2 = players[2];

  const isMyTurnOnline = !isOnline || currentPlayer === myPlayerIndex;
  
  // Resolve player names
  const localPlayerName = sessionStorage.getItem('playerName') || 'You';
  const p1Name = isOnline ? (myPlayerIndex === 1 ? localPlayerName : (opponentName || 'Opponent')) : 'Player 1';
  const p2Name = isOnline ? (myPlayerIndex === 2 ? localPlayerName : (opponentName || 'Opponent')) : 'Player 2';
  
  const currentPlayerName = currentPlayer === 1 ? p1Name : p2Name;

  // --- Slot Machine Spinner State ---
  const [previewCard, setPreviewCard] = useState<any>(CARDS[0]);
  const [isStopping, setIsStopping] = useState(false);

  useEffect(() => {
    if (phase !== 'WAITING_FOR_DRAW' || isStopping) return;

    const intervalId = setInterval(() => {
      const randomCard = CARDS[Math.floor(Math.random() * CARDS.length)];
      setPreviewCard(randomCard);
    }, 80);

    return () => clearInterval(intervalId);
  }, [phase, isStopping]);

  const handleStopAndDraw = () => {
    if (phase !== 'WAITING_FOR_DRAW' || isStopping || !isMyTurnOnline) return;
    setIsStopping(true);

    const slowDownDelays = [80, 120, 180, 260, 360, 500];
    let totalDelay = 0;

    slowDownDelays.forEach((delay, index) => {
      totalDelay += delay;
      setTimeout(() => {
        if (index === slowDownDelays.length - 1) {
          draw();
          setIsStopping(false);
        } else {
          setPreviewCard(CARDS[Math.floor(Math.random() * CARDS.length)]);
        }
      }, totalDelay);
    });
  };

  const displayCard = (phase === 'CARD_DRAWN' && cardPool) ? cardPool : previewCard;

  return (
    <div className="min-h-screen bg-[#0b1a2b] text-white p-2 lg:p-4 flex flex-col font-sans overflow-x-hidden">
      <header className="text-center mb-2 lg:mb-8">
        <h1 className="text-4xl landscape:text-5xl lg:text-6xl font-bold text-amber-500 tracking-wider uppercase drop-shadow-md title-font">Anime Arena</h1>
        <p className="text-slate-400 mt-1 text-xs lg:text-lg">
          {phase === 'GAME_OVER' 
            ? 'Game Over!' 
            : isOnline 
              ? (isMyTurnOnline ? 'Your Turn!' : `Waiting for ${currentPlayerName}...`)
              : `Turn: ${currentPlayerName} | Phase: ${phase}`}
        </p>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto grid grid-cols-1 landscape:grid-cols-3 gap-2 lg:gap-8">
        
        {/* PLAYER 1 BOARD */}
        <section className={`bg-[#0d2847]/80 rounded-xl p-2 lg:p-6 border-2 flex flex-col justify-center ${currentPlayer === 1 ? 'border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.5)]' : 'border-transparent'} ${isOnline && myPlayerIndex === 1 ? 'ring-4 ring-blue-500' : ''}`}>
          <div className="flex justify-between items-center mb-2 lg:mb-6 border-b border-slate-700 pb-1 lg:pb-4">
            <h2 className="text-sm lg:text-2xl font-bold text-blue-400">{p1Name} {isOnline && myPlayerIndex === 1 ? '(You)' : ''}</h2>
            <div className="text-right">
              <div className="text-[8px] lg:text-sm text-slate-400">Score</div>
              <div className="text-base lg:text-3xl font-mono text-amber-400 drop-shadow-md">{p1.score}</div>
            </div>
          </div>
          
          <div className="space-y-1 lg:space-y-3">
            {p1.team.map((slot, idx) => {
              const hasSynergy = slot.card && slot.card.role_affinity && slot.card.role_affinity.includes(slot.role);
              const isTurnTarget = currentPlayer === 1 && phase === 'CARD_DRAWN' && !slot.card;
              
              return (
              <div 
                key={idx}
                onClick={() => (isTurnTarget && isMyTurnOnline) ? place(1, idx) : null}
                className={`relative flex items-center p-1.5 lg:p-3 rounded-lg border-2 transition-all min-h-[40px] lg:min-h-[80px]
                  ${slot.card 
                    ? (hasSynergy ? 'bg-green-900/40 border-green-500/80 shadow-[0_0_10px_rgba(74,222,128,0.2)]' : 'bg-[#173f67] border-slate-600') 
                    : 'border-dashed border-[#4e73a0] hover:bg-[#1e4a7a] cursor-pointer'}
                  ${isTurnTarget ? 'slot-active' : ''}
                `}
              >
                <div className={`w-14 lg:w-20 text-[8px] lg:text-xs font-bold uppercase tracking-wider leading-tight ${hasSynergy ? 'text-green-400' : 'text-slate-400'}`}>
                  {slot.role}
                  {hasSynergy && <div className="text-[7px] lg:text-[10px] text-green-300 normal-case mt-0.5 animate-pulse">Synergy!</div>}
                </div>
                
                {slot.card ? (
                  <div className="flex-1 flex items-center gap-1.5 lg:gap-4">
                    <div className="w-8 h-8 lg:w-16 lg:h-16 bg-[#0b1a2b] rounded overflow-hidden flex-shrink-0 border-2 border-slate-700">
                       <img src={slot.card.img_url} alt={slot.card.name} className="w-full h-full object-cover" />
                    </div>
                    <div className={`font-bold text-[10px] lg:text-lg leading-tight ${hasSynergy ? 'text-green-100' : 'text-white'}`}>{slot.card.name}</div>
                  </div>
                ) : (
                  <div className="flex-1 text-slate-500 text-[9px] lg:text-sm italic">Empty Slot</div>
                )}
              </div>
            )})}
          </div>
        </section>

        {/* CENTER POOL (DRAFTING) */}
        <section className="flex flex-col items-center justify-center bg-[#0d2847]/50 rounded-xl p-2 lg:p-6 border border-slate-700 relative">
          <h3 className="text-xs lg:text-xl font-bold text-slate-300 mb-2 lg:mb-8 uppercase tracking-widest title-font tracking-widest">Drafting Pool</h3>
          
          <div className="flex-1 flex flex-col items-center justify-center w-full min-h-[160px] lg:min-h-[250px] relative">
            
            {displayCard && (
              <div 
                key={phase === 'CARD_DRAWN' ? displayCard.name : 'spinning'} 
                className={`w-36 lg:w-64 bg-[#173f67] rounded-xl border-2 border-amber-500 overflow-hidden shadow-[0_0_15px_rgba(255,215,0,0.5)] transition-all
                  ${phase === 'CARD_DRAWN' ? 'animate-card-draw z-10' : 'scale-95 opacity-90'}
                `}
              >
                <div className="h-28 lg:h-56 bg-[#0b1a2b] w-full relative">
                  <img src={displayCard.img_url} alt={displayCard.name} className="w-full h-full object-cover" />
                  <div className="absolute top-1 right-1 bg-amber-500 text-slate-900 text-[8px] lg:text-xs font-bold px-1.5 py-0.5 rounded uppercase">
                    {displayCard.universe}
                  </div>
                </div>
                <div className="p-2 lg:p-4 text-center">
                  <h4 className="text-[12px] lg:text-xl font-bold mb-1 lg:mb-2">{displayCard.name}</h4>
                  <div className="flex justify-center items-center gap-1 lg:gap-2 text-slate-400 text-[8px] lg:text-sm italic border-t border-slate-600 pt-2 lg:pt-3 mt-1">
                    <Shield className="w-3 h-3 lg:w-4 lg:h-4 opacity-50" /> Roles & Stats Hidden
                  </div>
                </div>
              </div>
            )}

            {phase === 'WAITING_FOR_DRAW' && (
              <button 
                onClick={handleStopAndDraw}
                disabled={isStopping || !isMyTurnOnline}
                className={`absolute z-20 btn-3d text-white rounded-xl flex items-center justify-center w-36 h-20 lg:w-64 lg:h-24 font-bold uppercase title-font text-3xl lg:text-5xl tracking-wider shadow-[0_10px_30px_rgba(0,0,0,0.8)]
                  ${(!isMyTurnOnline) ? 'bg-slate-700 opacity-50 cursor-not-allowed' : isStopping ? 'bg-amber-600 cursor-wait' : 'bg-red-600 hover:bg-red-500 animate-pulse'}
                `}
              >
                {(!isMyTurnOnline) ? 'WAITING' : isStopping ? 'STOPPING...' : 'STOP!'}
              </button>
            )}
          </div>

          <div className="mt-2 lg:mt-8 text-center h-16 lg:h-24 flex flex-col justify-end items-center">
            <p className={`text-amber-400 mb-2 lg:mb-4 text-[10px] lg:text-base font-bold transition-opacity ${phase === 'CARD_DRAWN' ? 'opacity-100 animate-pulse' : 'opacity-0 pointer-events-none'}`}>
              {!isMyTurnOnline ? `Waiting for ${currentPlayerName}...` : `${currentPlayerName}, place or skip!`}
            </p>
            <button 
              onClick={() => skip(currentPlayer)}
              disabled={phase !== 'CARD_DRAWN' || players[currentPlayer as 1|2].skipped || !isMyTurnOnline}
              className="btn-3d btn-skip text-white px-3 py-2 lg:px-6 lg:py-3 rounded-lg font-bold uppercase tracking-wider text-[10px] lg:text-base w-32 lg:w-48 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              SKIP CARD ({players[currentPlayer as 1|2].skipped ? '0' : '1'})
            </button>
          </div>
        </section>

        {/* PLAYER 2 BOARD */}
        <section className={`bg-[#0d2847]/80 rounded-xl p-2 lg:p-6 border-2 flex flex-col justify-center ${currentPlayer === 2 ? 'border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.5)]' : 'border-transparent'} ${isOnline && myPlayerIndex === 2 ? 'ring-4 ring-blue-500' : ''}`}>
          <div className="flex justify-between items-center mb-2 lg:mb-6 border-b border-slate-700 pb-1 lg:pb-4">
            <h2 className="text-sm lg:text-2xl font-bold text-red-400">{p2Name} {isOnline && myPlayerIndex === 2 ? '(You)' : ''}</h2>
            <div className="text-right">
              <div className="text-[8px] lg:text-sm text-slate-400">Score</div>
              <div className="text-base lg:text-3xl font-mono text-amber-400 drop-shadow-md">{p2.score}</div>
            </div>
          </div>
          
          <div className="space-y-1 lg:space-y-3">
            {p2.team.map((slot, idx) => {
              const hasSynergy = slot.card && slot.card.role_affinity && slot.card.role_affinity.includes(slot.role);
              const isTurnTarget = currentPlayer === 2 && phase === 'CARD_DRAWN' && !slot.card;
              
              return (
              <div 
                key={idx}
                onClick={() => (isTurnTarget && isMyTurnOnline) ? place(2, idx) : null}
                className={`relative flex items-center p-1.5 lg:p-3 rounded-lg border-2 transition-all min-h-[40px] lg:min-h-[80px]
                  ${slot.card 
                    ? (hasSynergy ? 'bg-green-900/40 border-green-500/80 shadow-[0_0_10px_rgba(74,222,128,0.2)]' : 'bg-[#173f67] border-slate-600') 
                    : 'border-dashed border-[#4e73a0] hover:bg-[#1e4a7a] cursor-pointer'}
                  ${isTurnTarget ? 'slot-active' : ''}
                `}
              >
                <div className={`w-14 lg:w-20 text-[8px] lg:text-xs font-bold uppercase tracking-wider leading-tight ${hasSynergy ? 'text-green-400' : 'text-slate-400'}`}>
                  {slot.role}
                  {hasSynergy && <div className="text-[7px] lg:text-[10px] text-green-300 normal-case mt-0.5 animate-pulse">Synergy!</div>}
                </div>
                
                {slot.card ? (
                  <div className="flex-1 flex items-center gap-1.5 lg:gap-4">
                    <div className="w-8 h-8 lg:w-16 lg:h-16 bg-[#0b1a2b] rounded overflow-hidden flex-shrink-0 border-2 border-slate-700">
                       <img src={slot.card.img_url} alt={slot.card.name} className="w-full h-full object-cover" />
                    </div>
                    <div className={`font-bold text-[10px] lg:text-lg leading-tight ${hasSynergy ? 'text-green-100' : 'text-white'}`}>{slot.card.name}</div>
                  </div>
                ) : (
                  <div className="flex-1 text-slate-500 text-[9px] lg:text-sm italic">Empty Slot</div>
                )}
              </div>
            )})}
          </div>
        </section>

      </main>
    </div>
  );
}

export default App;
