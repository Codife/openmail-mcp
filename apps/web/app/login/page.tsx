'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase/browser';

export default function Login() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState<'login' | 'reset' | null>(null);
  async function submit(form: FormData) {
    setError('');
    setNotice('');
    setBusy('login');
    const { error } = await createSupabaseBrowser().auth.signInWithPassword({
      email: String(form.get('email')).trim(),
      password: String(form.get('password')),
    });
    setBusy(null);
    if (error) setError(error.message);
    else {
      router.replace('/dashboard');
      router.refresh();
    }
  }
  async function forgot(form: HTMLFormElement) {
    setError('');
    setNotice('');
    const email = String(new FormData(form).get('email') ?? '').trim();
    if (!email) {
      setError('Enter your email address first.');
      return;
    }
    setBusy('reset');
    const { error } = await createSupabaseBrowser().auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${location.origin}/auth/callback?next=/auth/update-password`,
      },
    );
    setBusy(null);
    if (error) setError(error.message);
    else
      setNotice('Password reset email sent. Check your inbox and spam folder.');
  }
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <form action={submit} className="panel w-full max-w-sm space-y-4 p-7">
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="muted text-sm">
          Sign in to manage mailboxes and MCP clients.
        </p>
        <label className="block text-sm">
          Email
          <input
            className="mt-1"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </label>
        <label className="block text-sm">
          Password
          <input
            className="mt-1"
            name="password"
            type="password"
            autoComplete="current-password"
            minLength={8}
            required
          />
        </label>
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="text-sm text-green-700">
            {notice}
          </p>
        )}
        <button
          className="button w-full justify-center"
          type="submit"
          disabled={busy !== null}
        >
          {busy === 'login' ? 'Signing in…' : 'Sign in'}
        </button>
        <button
          type="button"
          className="muted w-full text-sm"
          disabled={busy !== null}
          onClick={(event) => forgot(event.currentTarget.form!)}
        >
          {busy === 'reset' ? 'Sending reset email…' : 'Forgot password?'}
        </button>
      </form>
    </main>
  );
}
