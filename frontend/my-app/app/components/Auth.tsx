"use client";
import { useState } from 'react';
import axios from 'axios';

interface AuthProps {
  onLogin: (user: any) => void;
}

export default function Auth({ onLogin }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [withdrawalMobile, setWithdrawalMobile] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = isLogin ? '/login' : '/register';
    const payload = isLogin ? { loginId, password } : { loginId, password, withdrawalMobile };
    
    try {
      const { data } = await axios.post(`http://localhost:5000/api/auth${endpoint}`, payload);
      if (isLogin) {
        localStorage.setItem('token', data.token);
        onLogin(data.user);
      } else {
        alert('Registered! Please log in.');
        setIsLogin(true);
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error during authentication');
    }
  };

  return (
    <div className="card">
      <h2>{isLogin ? 'Login' : 'Register'}</h2>
      <form onSubmit={handleSubmit}>
        <input 
          type="text" 
          placeholder="Email or Mobile Number" 
          value={loginId} 
          onChange={e => setLoginId(e.target.value)} 
          required 
        />
        {!isLogin && (
          <input 
            type="text" 
            placeholder="Withdrawal Mobile Number (Cannot change)" 
            value={withdrawalMobile} 
            onChange={e => setWithdrawalMobile(e.target.value)} 
            required 
          />
        )}
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
          required 
        />
        <button type="submit">{isLogin ? 'Play Now' : 'Create Account'}</button>
      </form>
      <p 
        onClick={() => setIsLogin(!isLogin)} 
        style={{ textAlign: 'center', marginTop: '10px', color: '#aaa', cursor: 'pointer' }}
      >
        {isLogin ? "Need an account? Register" : "Have an account? Login"}
      </p>
    </div>
  );
}