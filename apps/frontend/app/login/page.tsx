'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../components/auth-provider';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await login(phone, password);
      router.replace('/dashboard');
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Не удалось выполнить вход',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4">
      <form
        onSubmit={submit}
        className="mx-auto mt-24 max-w-md rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
      >
        <h1 className="text-2xl font-bold text-blue-700">AutoStock</h1>
        <p className="mt-1 text-sm text-slate-500">
          Вход в рабочую систему
        </p>

        <label className="mt-6 block text-sm">
          Телефон
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            required
            className="mt-1 w-full rounded border border-slate-300 p-3"
            autoComplete="tel"
          />
        </label>

        <label className="mt-4 block text-sm">
          Пароль
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="mt-1 w-full rounded border border-slate-300 p-3"
            autoComplete="current-password"
          />
        </label>

        {error && (
          <p role="alert" className="mt-4 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          disabled={isSubmitting}
          className="mt-6 w-full rounded bg-blue-600 p-3 font-medium text-white disabled:opacity-60"
        >
          {isSubmitting ? 'Входим…' : 'Войти'}
        </button>
      </form>
    </main>
  );
}
