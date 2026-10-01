'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { login, signup, getCurrentUser, ADMIN_WHITELIST } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { Terminal, Shield, User, ArrowRight, Lock, KeyRound, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  // If already logged in, redirect directly to calendar
  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      router.replace('/');
    }
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isSignUp) {
      const res = signup(name, identifier);
      if (!res.success) {
        setError(res.error || 'Registration failed');
        return;
      }
      router.push('/');
    } else {
      const res = login(identifier);
      if (!res.success) {
        setError(res.error || 'Authentication failed');
        return;
      }
      router.push('/');
    }
  };

  const handleSelectWhitelisted = (handle: string) => {
    login(handle);
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-[#070b0e] text-zinc-200 font-mono flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-md bg-[#0b1016] border border-zinc-800 rounded-xl p-6 shadow-2xl space-y-5 relative overflow-hidden"
        >
          {/* Subtle top glowing bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-purple-500" />

          {/* Header */}
          <div className="border-b border-zinc-800/80 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <Terminal className="w-4 h-4" />
              <span>RADAR_GATE // AUTHENTICATE</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 uppercase">
              {isSignUp ? 'SIGN_UP' : 'REMEMBERED_SESSION'}
            </span>
          </div>

          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              {isSignUp ? 'New Hacker Registration' : 'Log In to Access Opportunity Radar'}
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Sign in once to unlock the live calendar, track participation, and access whitelisted administrative tools. Your login will be remembered.
            </p>
          </div>

          {error && (
            <div className="p-2.5 rounded bg-rose-950/50 border border-rose-500/70 text-rose-300 text-xs font-mono">
              // ERROR: {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {isSignUp && (
              <div>
                <label className="block text-zinc-400 mb-1">FULL NAME</label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ada Lovelace"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-[#080c10] border border-zinc-800 rounded text-zinc-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-zinc-400 mb-1">USERNAME, HANDLE OR EMAIL</label>
              <div className="relative">
                <KeyRound className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. TanayThapar, Sanvi850, or your handle"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#080c10] border border-zinc-800 rounded text-zinc-200 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-black font-bold rounded transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span>{isSignUp ? 'REGISTER & ENTER' : 'LOG IN & ENTER RADAR'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Switch mode */}
          <div className="pt-2 text-center text-xs text-zinc-400">
            {isSignUp ? (
              <span>
                Already have an identity?{' '}
                <button
                  type="button"
                  onClick={() => setIsSignUp(false)}
                  className="text-emerald-400 hover:underline font-bold"
                >
                  Log In
                </button>
              </span>
            ) : (
              <span>
                New user?{' '}
                <button
                  type="button"
                  onClick={() => setIsSignUp(true)}
                  className="text-emerald-400 hover:underline font-bold"
                >
                  Create identity
                </button>
              </span>
            )}
          </div>

          {/* Whitelisted Admins Quick-Login Option */}
          <div className="pt-3 border-t border-zinc-800/80 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-zinc-500">
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-purple-400" />
                <span>WHITELISTED_ADMINS:</span>
              </span>
              <span className="text-purple-400 font-bold">TanayThapar • Sanvi850 • panchadip125</span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleSelectWhitelisted('TanayThapar')}
                className="py-1.5 px-2 bg-zinc-900 hover:bg-purple-950/40 border border-purple-500/40 text-purple-300 rounded text-xs transition-all text-left flex items-center justify-between"
              >
                <span>@TanayThapar</span>
                <span className="text-[10px] text-zinc-500">&gt;</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectWhitelisted('Sanvi850')}
                className="py-1.5 px-2 bg-zinc-900 hover:bg-purple-950/40 border border-purple-500/40 text-purple-300 rounded text-xs transition-all text-left flex items-center justify-between"
              >
                <span>@Sanvi850</span>
                <span className="text-[10px] text-zinc-500">&gt;</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectWhitelisted('panchadip125')}
                className="py-1.5 px-2 bg-zinc-900 hover:bg-purple-950/40 border border-purple-500/40 text-purple-300 rounded text-xs transition-all text-left flex items-center justify-between"
              >
                <span>@panchadip125</span>
                <span className="text-[10px] text-zinc-500">&gt;</span>
              </button>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
