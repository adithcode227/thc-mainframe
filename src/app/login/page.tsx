'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Hotel, KeyRound, Loader2, ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from 'src/lib/supabase-client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSandbox, setIsSandbox] = useState(true);

  // Check if env variables exist to see if we are in Sandbox Mode
  useEffect(() => {
    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    setIsSandbox(!hasUrl || !hasKey);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please fill in both email and password fields.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'An unexpected authentication error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoBypass = () => {
    setLoading(true);
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans antialiased">
      
      {/* Back button */}
      <div className="max-w-sm w-full mx-auto mb-4">
        <Link 
          href="/" 
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 font-semibold uppercase tracking-wider transition-colors"
        >
          <ArrowLeft size={14} /> Back to registration
        </Link>
      </div>

      {/* Main card */}
      <div className="bg-zinc-900 border border-zinc-800 shadow-xl rounded-2xl overflow-hidden max-w-sm w-full mx-auto p-8 sm:p-10">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-zinc-950 text-zinc-100 rounded-full mb-3 border border-zinc-800">
            <Hotel size={22} />
          </div>
          <span className="text-xs font-semibold text-zinc-400 block tracking-wide">
            Staff Portal Access
          </span>
          <h2 className="text-2xl font-bold text-zinc-50 mt-1 mb-1 tracking-tight">
            Sign In
          </h2>
          <p className="text-xs text-zinc-500 font-normal">
            Official resort audit logs
          </p>
        </div>

        {/* Sandbox Indicator */}
        {isSandbox && (
          <div className="mb-6 p-4 bg-amber-950/20 border border-amber-900 text-amber-300 text-xs rounded-xl leading-relaxed">
            <div className="flex gap-2">
              <ShieldAlert size={16} className="shrink-0 text-amber-500 mt-0.5" />
              <div>
                <strong className="block font-bold tracking-wide text-xs mb-0.5">Sandbox Mode Active</strong>
                <span>The app is running offline. You can bypass authentication directly.</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDemoBypass}
              disabled={loading}
              className="mt-3 w-full inline-flex items-center justify-center gap-1.5 bg-zinc-50 hover:bg-zinc-200 text-zinc-955 font-bold py-2.5 text-xs uppercase tracking-wider transition-colors cursor-pointer rounded-lg border border-zinc-50"
            >
              {loading ? <Loader2 size={13} className="animate-spin" /> : 'Bypass & Demo Login'}
            </button>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="flex flex-col">
            <label htmlFor="email" className="text-xs font-semibold text-zinc-200 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="manager@resort.com"
              disabled={loading}
              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-50 placeholder:text-zinc-550 text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 transition-all font-medium"
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="password" className="text-xs font-semibold text-zinc-200 mb-1.5">
              Access Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-50 placeholder:text-zinc-550 text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 transition-all font-medium"
            />
          </div>

          {error && (
            <div className="p-3 bg-rose-955/20 text-rose-400 text-xs font-bold border border-rose-900/60 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || isSandbox}
            className="w-full inline-flex items-center justify-center gap-2 bg-zinc-50 hover:bg-zinc-200 text-zinc-950 font-bold py-3.5 text-xs uppercase tracking-widest rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading && !isSandbox ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <KeyRound size={14} />
                <span>Log In</span>
              </>
            )}
          </button>
        </form>

      </div>

    </div>
  );
}
