"use client";
import { useState } from 'react';

interface DashboardProps {
  user: {
    id: string;
    real_balance: number;
    demo_balance: number;
  };
  onJoinMatch: (gameType: string, mode: string, entryFee: number) => void;
}

const gamesByCategory = {
  board: [
    { id: 'chess', name: 'Chess 1v1' },
    { id: 'checkers', name: 'Checkers' },
    { id: 'connect4', name: 'Connect 4' }
  ],
  card: [
    { id: 'blackjack', name: 'Blackjack 1v1' },
    { id: 'poker', name: 'Texas Hold\'em Poker' }
  ],
  trivia: [
    { id: 'speed_trivia', name: 'Speed Trivia Battle' },
    { id: 'math_quiz', name: 'Math Speed Challenge' }
  ],
  arcade: [
    { id: 'runner', name: 'Endless Runner Lap Time' },
    { id: 'shooter', name: '2D Arena Shooter' }
  ]
};

// Explicitly define the category keys type
type CategoryKey = keyof typeof gamesByCategory;

export default function Dashboard({ user, onJoinMatch }: DashboardProps) {
  const [mode, setMode] = useState('DEMO');
  const [entryFee, setEntryFee] = useState(100);
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('board');
  const [gameType, setGameType] = useState('chess');

  return (
    <div>
      <div className="card">
        <h3>Account Balances</h3>
        <p>Demo Credits: {user.demo_balance}</p>
        <p>Real Money: KES {user.real_balance}</p>
      </div>

      <div className="card">
        <h3>Find a Match</h3>
        
        <label style={{ fontSize: '12px', color: '#aaa' }}>Mode</label>
        <select value={mode} onChange={e => setMode(e.target.value)}>
          <option value="DEMO">Demo Mode (Free Practice)</option>
          <option value="MONEY">Real Money (Betting)</option>
        </select>
        
        <label style={{ fontSize: '12px', color: '#aaa' }}>Category</label>
        <select 
          value={selectedCategory} 
          onChange={e => {
            const cat = e.target.value as CategoryKey;
            setSelectedCategory(cat);
            setGameType(gamesByCategory[cat][0].id);
          }}
        >
          <option value="board">Board Games</option>
          <option value="card">Card Games</option>
          <option value="trivia">Trivia & Quiz</option>
          <option value="arcade">Arcade & Action</option>
        </select>

        <label style={{ fontSize: '12px', color: '#aaa' }}>Game</label>
        <select value={gameType} onChange={e => setGameType(e.target.value)}>
          {gamesByCategory[selectedCategory].map(g => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
        
        <label style={{ fontSize: '12px', color: '#aaa' }}>Entry Stake</label>
        <input 
          type="number" 
          placeholder="Entry Fee Amount" 
          value={entryFee} 
          onChange={e => setEntryFee(Number(e.target.value))} 
          min={1}
        />
        
        <button onClick={() => onJoinMatch(gameType, mode, entryFee)}>
          Join {mode} Match ({entryFee})
        </button>
      </div>
    </div>
  );
}