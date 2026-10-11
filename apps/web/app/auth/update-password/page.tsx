'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase/browser';
export default function UpdatePassword() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(form: FormData) {
    setError('');
    const password = String(form.get('password'));
    const confirmation = String(form.get('confirmation'));
    if (password !== confirmation) {
      setError('Passwords do not match');
      return;
    }
    if (
      password.length < 12 ||
      !/[a-z]/.test(password) ||
      !/[A-Z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[^A-Za-z0-9]/.test(password)
    ) {
      setError('Use 12+ characters with upper, lower, number, and symbol');
      return;
    }
    setBusy(true);
    const client = createSupabaseBrowser();
    const {
      data: { user },
      error: userError,
    } = await client.auth.getUser();
    if (userError || !user) {
      setBusy(false);
      setError(
        'Your password reset link is invalid or expired. Request a new one from the login page.',
      );
      return;
    }
    const { error } = await client.auth.updateUser({
      password,
      data: { ...(user.user_metadata ?? {}), password_change_required: false },
    });
    setBusy(false);
    if (error) setError(error.message);
    else {
      router.replace('/dashboard');
      router.refresh();
    }
  }
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <form action={submit} className="panel w-full max-w-sm space-y-4 p-7">
        <h1 className="text-2xl font-bold">Set a new password</h1>
        <p className="muted text-sm">
          Choose a strong password before continuing.
        </p>
        <label className="block text-sm">
          New password
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={12}
            required
          />
        </label>
        <label className="block text-sm">
          Confirm password
          <input
            name="confirmation"
            type="password"
            autoComplete="new-password"
            minLength={12}
            required
          />
        </label>
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        <button className="button w-full justify-center" disabled={busy}>
          {busy ? 'Updating password…' : 'Update password'}
        </button>
      </form>
    </main>
  );
}
