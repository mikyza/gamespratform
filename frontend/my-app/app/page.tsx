"use client";
import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

import Auth from './components/Auth';
import Dashboard from './components/Dashboard';

// Ensures frontend always communicates with your live Render backend
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://gamespratform.onrender.com';

const GAME_EMBED_URLS: Record<string, string> = {
  chess: 'https://lichess.org/tv/frame?theme=brown&bg=dark',
  checkers: 'https://html5.gamedistribution.com/rvvASSmo/checkers/',
  connect4: 'https://html5.gamedistribution.com/connect-4/',
  blackjack: 'https://html5.gamedistribution.com/blackjack/',
  poker: 'https://html5.gamedistribution.com/poker/',
  speed_trivia: 'https://opentdb.com/',
  math_quiz: 'https://html5.gamedistribution.com/math-games/',
  runner: 'https://playcanv.as/p/2O2R206U/',
  shooter: 'https://playcanv.as/p/a83e022f/'
};

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [matchState, setMatchState] = useState<'waiting' | 'playing' | null>(null);
  const [activeGame, setActiveGame] = useState<string>('chess');
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (user && !socketRef.current) {
      // Connects directly to the Render backend port
      socketRef.current = io(BACKEND_URL, {
        transports: ['websocket', 'polling'], // Ensures stable connection
      });

      socketRef.current.on('error', (msg: string) => alert(msg));
      socketRef.current.on('waiting_for_opponent', () => setMatchState('waiting'));
      socketRef.current.on('game_start', (match: any) => setMatchState('playing'));
      
      socketRef.current.on('match_settled', ({ payout, isDraw }: { payout: number, isDraw: boolean }) => {
        alert(isDraw ? '🤝 Game Drawn! Bets fully refunded.' : `🎉 Game Over! Payout: KES ${payout}`);
        setMatchState(null);
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user]);

  const handleJoinMatch = (gameType: string, mode: string, entryFee: number) => {
    setActiveGame(gameType);
    if (socketRef.current && user) {
      socketRef.current.emit('join_match', { 
        userId: user.id, 
        gameType, 
        mode, 
        entryFee 
      });
    }
  };

  const handleFinishMatch = (isDraw = false) => {
    if (socketRef.current && user) {
      socketRef.current.emit('match_end', { 
        matchId: socketRef.current.id, 
        winnerId: user.id, 
        isDraw 
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-gray-100 font-sans selection:bg-indigo-500 selection:text-white p-4 md:p-8 flex flex-col items-center">
      
      {/* Header Section */}
      <header className="w-full max-w-5xl flex justify-between items-center mb-8 md:mb-12">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 text-transparent bg-clip-text drop-shadow-sm">
          🏆 Arena Platform
        </h1>
        {user && (
          <div className="bg-gray-800/80 px-4 py-2 rounded-full border border-gray-700 shadow-sm flex items-center gap-2 text-sm md:text-base font-medium">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            {user.username || 'Player'}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-5xl">
        {!user ? (
          <div className="bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-3xl p-6 md:p-10 shadow-2xl">
            <Auth onLogin={setUser} />
          </div>
        ) : matchState ? (
          <div className="bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-3xl p-4 md:p-8 shadow-2xl w-full flex flex-col items-center animate-fade-in">
            
            {/* Waiting State UI */}
            {matchState === 'waiting' ? (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-6">
                <div className="relative flex justify-center items-center w-20 h-20">
                  <div className="absolute w-full h-full border-4 border-indigo-500/30 rounded-full animate-ping"></div>
                  <div className="absolute w-16 h-16 border-4 border-t-indigo-500 border-r-purple-500 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-100">Finding Opponent...</h2>
                  <p className="text-gray-400 mt-2">Waiting for someone to join the {activeGame} arena.</p>
                </div>
              </div>
            ) : (
              
              /* Playing State UI */
              <div className="w-full flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-100 uppercase tracking-wide">
                    🎮 Playing: <span className="text-indigo-400">{activeGame}</span>
                  </h2>
                  <div className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-xs font-bold uppercase tracking-wider animate-pulse">
                    Live Match
                  </div>
                </div>
                
                {/* Responsive Iframe Container */}
                <div className="w-full bg-black rounded-xl overflow-hidden border-2 border-gray-800 shadow-[0_0_40px_rgba(99,102,241,0.15)]">
                  <iframe
                    src={GAME_EMBED_URLS[activeGame] || GAME_EMBED_URLS.chess}
                    className="w-full h-[60vh] md:h-[70vh] min-h-[400px] border-none"
                    title="Live Game Session"
                    allowFullScreen
                  />
                </div>

                {/* Match Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-end mt-2">
                  <button 
                    onClick={() => handleFinishMatch(true)}
                    className="order-2 sm:order-1 px-6 py-3 md:py-4 rounded-xl font-bold text-red-300 bg-red-950/40 border border-red-900/50 hover:bg-red-900/60 hover:text-red-100 transition-all duration-200 ease-in-out shadow-sm active:scale-95"
                  >
                    🤝 Declare Draw
                  </button>
                  <button 
                    onClick={() => handleFinishMatch(false)}
                    className="order-1 sm:order-2 px-6 py-3 md:py-4 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg hover:shadow-indigo-500/25 transition-all duration-200 ease-in-out active:scale-95"
                  >
                    🏆 Claim Victory & Settle Payout
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Dashboard user={user} onJoinMatch={handleJoinMatch} />
        )}
      </main>
    </div>
  );
}
