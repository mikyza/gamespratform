"use client";
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import { io } from "socket.io-client";

const socket = io("https://gamespratform.onrender.com", {
  transports: ["websocket"], // Bypasses HTTP long-polling requests
  reconnectionAttempts: 5,
  timeout: 10000,
});


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
      // Warm up Render instance over HTTP to prevent 502 gateway drops
      fetch(`${BACKEND_URL}/health`)
        .catch((err) => console.warn('Backend warm-up ping failed:', err))
        .finally(() => {
          socketRef.current = io(BACKEND_URL, {
            transports: ['polling', 'websocket'], // Polling first prevents direct WS proxy drops on Render
            withCredentials: true,
            reconnectionAttempts: 15,
            reconnectionDelay: 2000,
          });

          socketRef.current.on('connect', () => {
            console.log('✅ Socket connected successfully:', socketRef.current?.id);
          });

          socketRef.current.on('connect_error', (err) => {
            console.warn('Socket connection error:', err.message);
          });

          socketRef.current.on('error', (msg: string) => alert(`⚠️ ${msg}`));
          socketRef.current.on('waiting_for_opponent', () => setMatchState('waiting'));
          socketRef.current.on('game_start', () => setMatchState('playing'));
          
          socketRef.current.on('match_settled', ({ payout, isDraw }: { payout: number, isDraw: boolean }) => {
            alert(isDraw ? '🤝 Game Drawn! Bets fully refunded.' : `🏆 Game Over! Payout: KES ${payout}`);
            setMatchState(null);
          });
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

  const handleLogout = () => {
    setUser(null);
    setMatchState(null);
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 font-sans selection:bg-indigo-500 selection:text-white p-3 sm:p-6 lg:p-8 flex flex-col items-center">
      
      {/* Top Navigation Header */}
      <header className="w-full max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 p-4 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-xl shadow-lg shadow-indigo-500/20">
            🏆
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 text-transparent bg-clip-text">
              Arena Platform
            </h1>
            <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-widest">
              Real-Time Multiplayer Gaming
            </p>
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800">
            
            {/* NEW: Admin Panel Link (Only visible if user is admin) */}
            {user.role === 'admin' && (
              <Link href="/admin" className="px-3.5 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-xl text-xs sm:text-sm font-bold transition-all">
                ⚙️ Admin Panel
              </Link>
            )}

            <div className="flex items-center gap-2 bg-slate-800/80 px-3.5 py-1.5 rounded-xl border border-slate-700/60 text-xs sm:text-sm font-semibold">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
              <span className="text-slate-200">{user.username || user.email?.split('@')[0] || 'Player'}</span>
            </div>

            <button 
              onClick={handleLogout}
              className="px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs sm:text-sm font-bold transition-all active:scale-95"
            >
              Logout
            </button>
          </div>
        )}
      </header>

      {/* Main App Canvas */}
      <main className="w-full max-w-6xl">
        {!user ? (
          <div className="w-full max-w-md mx-auto bg-slate-900/50 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <Auth onLogin={setUser} />
          </div>
        ) : matchState ? (
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl w-full flex flex-col items-center">
            {/* Embed & Live Controls Area */}
             <div className="w-full flex flex-col gap-5">
                <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 p-3.5 sm:p-4 rounded-2xl border border-slate-800">
                  <h2 className="text-base sm:text-xl font-black text-slate-100 uppercase tracking-wide flex items-center gap-2">
                    🎮 Arena: <span className="text-indigo-400">{activeGame}</span>
                  </h2>
                </div>
                <div className="w-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-[0_0_50px_rgba(99,102,241,0.1)] relative">
                  <iframe
                    src={GAME_EMBED_URLS[activeGame] || GAME_EMBED_URLS.chess}
                    className="w-full h-[55vh] sm:h-[65vh] lg:h-[72vh] min-h-[380px] border-none"
                    title="Live Game Session"
                    allowFullScreen
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-end mt-1">
                  <button onClick={() => handleFinishMatch(true)} className="px-5 py-3.5 rounded-xl font-bold text-slate-300 bg-slate-800 hover:bg-slate-700">🤝 Declare Draw</button>
                  <button onClick={() => handleFinishMatch(false)} className="px-7 py-3.5 rounded-xl font-extrabold text-white bg-gradient-to-r from-emerald-600 to-teal-600">🏆 Claim Victory</button>
                </div>
              </div>
          </div>
        ) : (
          <Dashboard user={user} onJoinMatch={handleJoinMatch} />
        )}
      </main>
    </div>
  );
}
