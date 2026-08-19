"use client";
import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

import Auth from './components/Auth';
import Dashboard from './components/Dashboard';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

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
      socketRef.current = io(BACKEND_URL);

      socketRef.current.on('error', (msg: string) => alert(msg));
      socketRef.current.on('waiting_for_opponent', () => setMatchState('waiting'));
      socketRef.current.on('game_start', (match: any) => setMatchState('playing'));
      
      socketRef.current.on('match_settled', ({ payout, isDraw }: { payout: number, isDraw: boolean }) => {
        alert(isDraw ? 'Game Drawn! Bets fully refunded.' : `Game Over! Payout: KES ${payout}`);
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
    <div className="app-container">
      <h1>🏆 Arena Platform</h1>
      {!user ? (
        <Auth onLogin={setUser} />
      ) : matchState ? (
        <div className="card">
          <h2>{matchState === 'waiting' ? 'Waiting for Opponent...' : `Playing: ${activeGame.toUpperCase()}`}</h2>
          
          {matchState === 'playing' && (
            <div style={{ marginTop: '15px' }}>
              <iframe
                src={GAME_EMBED_URLS[activeGame] || GAME_EMBED_URLS.chess}
                style={{ width: '100%', height: '420px', border: 'none', borderRadius: '8px' }}
                title="Live Game Session"
                allow="fullscreen"
              />
              <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <button onClick={() => handleFinishMatch(false)}>
                  Claim Victory & Settle Payout
                </button>
                <button 
                  style={{ background: '#ff4d4d', color: '#fff' }} 
                  onClick={() => handleFinishMatch(true)}
                >
                  Declare Draw
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <Dashboard user={user} onJoinMatch={handleJoinMatch} />
      )}
    </div>
  );
}