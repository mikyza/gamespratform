"use client";
import { useState } from 'react';

interface AuthProps {
  onLogin: (userData: any) => void;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://gamespratform.onrender.com';

export default function Auth({ onLogin }: AuthProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [withdrawalMobile, setWithdrawalMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Input sanitization
    const cleanLoginId = loginId.trim();
    const cleanPassword = password;
    const cleanWithdrawalMobile = withdrawalMobile.trim() || cleanLoginId;

    if (cleanPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
    
    try {
      // Payload precisely matches the backend expectations
      const payload = isRegistering
        ? { 
            loginId: cleanLoginId, 
            password: cleanPassword, 
            withdrawalMobile: cleanWithdrawalMobile 
          }
        : { 
            loginId: cleanLoginId, 
            password: cleanPassword 
          };

      const res = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error(`Server returned non-JSON response (${res.status}). Check backend logs.`);
      }

      if (!res.ok) {
        const serverError = data.error || data.message || data.msg || `Authentication failed with status ${res.status}`;
        throw new Error(serverError);
      }

      onLogin(data.user || data);
    } catch (err: any) {
      console.error('Auth Error:', err);
      setError(err.message || 'Something went wrong. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          {isRegistering ? 'Create Your Account' : 'Welcome Back'}
        </h2>
        <p className="text-sm text-gray-400 mt-2">
          {isRegistering 
            ? 'Join the arena and start competing today.' 
            : 'Sign in to jump back into the action.'}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center font-medium animate-shake">
          <span className="inline-block mr-1">⚠️</span> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
            Email or Phone Number
          </label>
          <input
            type="text"
            required
            autoComplete="username"
            placeholder="player@example.com or 0712345678"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-gray-800/80 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
          />
        </div>

        {isRegistering && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
              Withdrawal Mobile (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. 0712345678"
              value={withdrawalMobile}
              onChange={(e) => setWithdrawalMobile(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-800/80 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
            />
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
            Password
          </label>
          <input
            type="password"
            required
            autoComplete={isRegistering ? "new-password" : "current-password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-gray-800/80 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold shadow-lg hover:shadow-indigo-500/25 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            isRegistering ? 'Create Account & Play' : 'Play Now'
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={() => {
            setIsRegistering(!isRegistering);
            setError('');
          }}
          className="text-sm font-medium text-gray-400 hover:text-indigo-400 transition-colors duration-200 underline-offset-4 hover:underline"
        >
          {isRegistering 
            ? 'Already have an account? Sign In' 
            : "Don't have an account? Register"}
        </button>
      </div>
    </div>
  );
}
