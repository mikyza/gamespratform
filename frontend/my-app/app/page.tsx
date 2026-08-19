"use client";
import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

import Auth from './components/Auth';
import Dashboard from './components/Dashboard';

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
      socketRef.current = io(BACKEND_URL, {
        transports: ['websocket', 'polling'],
      });

      socketRef.current.on('error', (msg: string) => alert(msg));
      socketRef.current.on('waiting_for_opponent', () => setMatchState('waiting'));
      socketRef.current.on('game_start', () => setMatchState('playing'));
      
      socketRef.current.on('match_settled', ({ payout, isDraw }: { payout: number, isDraw: boolean }) => {
        alert(isDraw ? '🤝 Game Drawn! Bets fully refunded.' : `🏆 Game Over! Payout: KES ${payout}`);
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
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 selection:bg-indigo-500 selection:text-white flex flex-col antialiased">
      
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/80 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-xl font-bold">
              🏆
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-black tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 text-transparent bg-clip-text">
                Arena Platform
              </h1>
              <p className="text-[10px] sm:text-xs text-indigo-400 font-semibold tracking-wider uppercase hidden sm:block">
                Real-Time Multiplayer Gaming
              </p>
            </div>
          </div>

          {user && (
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 bg-slate-800/60 border border-slate-700/60 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300">
                <span className="text-emerald-400 font-bold">KES {user.real_balance ?? 0}</span>
                <span className="text-slate-500">|</span>
                <span className="text-amber-400 font-bold">{user.demo_balance ?? 1000} Demo</span>
              </div>

              <div className="bg-slate-800/90 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border border-slate-700/80 shadow-inner flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{user.username || user.loginId || 'Player'}</span>
              </div>

              <button
                onClick={() => setUser(null)}
                className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition-all"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 flex flex-col justify-center">
        {!user ? (
          <div className="max-w-md w-full mx-auto bg-slate-900/70 backdrop-blur-xl border border-slate-800/90 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-indigo-950/20">
            <Auth onLogin={setUser} />
          </div>
        ) : matchState ? (
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-4 sm:p-8 shadow-2xl w-full flex flex-col items-center">
            
            {/* Finding Match Scanner */}
            {matchState === 'waiting' ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                <div className="relative flex justify-center items-center w-24 h-24">
                  <div className="absolute w-full h-full border-4 border-indigo-500/20 rounded-full animate-ping"></div>
                  <div className="absolute w-20 h-20 border-4 border-t-indigo-500 border-r-purple-500 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                  <span className="text-2xl">⚔️</span>
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Finding Opponent...</h2>
                  <p className="text-sm sm:text-base text-slate-400 mt-2">
                    Searching for an active challenger in the <span className="text-indigo-400 font-bold capitalize">{activeGame}</span> arena.
                  </p>
                </div>
              </div>
            ) : (
              
              /* Live Game Session */
              <div className="w-full flex flex-col gap-6">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg text-xs font-black uppercase tracking-widest">
                      Live Match
                    </span>
                    <h2 className="text-lg sm:text-2xl font-black text-white capitalize">
                      {activeGame}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    Connected to Server
                  </div>
                </div>
                
                {/* Embedded Game Viewer */}
                <div className="w-full bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl relative min-h-[450px] sm:min-h-[600px]">
                  <iframe
                    src={GAME_EMBED_URLS[activeGame] || GAME_EMBED_URLS.chess}
                    className="w-full h-[60vh] sm:h-[70vh] min-h-[450px] border-none"
                    title="Live Game Session"
                    allowFullScreen
                  />
                </div>

                {/* Match Action Bar */}
                <div className="flex flex-col sm:flex-row gap-3 justify-end pt-2">
                  <button 
                    onClick={() => handleFinishMatch(true)}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-red-300 bg-red-950/40 border border-red-900/60 hover:bg-red-900/50 transition-all duration-200 active:scale-[0.98] text-sm"
                  >
                    🤝 Declare Draw
                  </button>
                  <button 
                    onClick={() => handleFinishMatch(false)}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-600/20 transition-all duration-200 active:scale-[0.98] text-sm"
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
