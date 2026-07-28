'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import {
  createPartAlias,
  deletePartAlias,
  getPartAliases,
  PartAlias,
} from '../lib/api';

export function PartAliasManager({ partId }: { partId: string }) {
  const [aliases, setAliases] = useState<PartAlias[]>([]);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setAliases(await getPartAliases(partId));
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Не удалось загрузить синонимы',
      );
    }
  }, [partId]);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  async function add(event: FormEvent) {
    event.preventDefault();
    if (!value.trim() || busy) return;
    setBusy(true);
    setError('');
    try {
      await createPartAlias(partId, value.trim());
      setValue('');
      await load();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'Не удалось добавить синоним',
      );
    } finally {
      setBusy(false);
    }
  }

  async function remove(aliasId: string) {
    setError('');
    try {
      await deletePartAlias(partId, aliasId);
      await load();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'Не удалось удалить синоним',
      );
    }
  }

  return (
    <section className="mt-5 max-w-2xl rounded-xl bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold">Синонимы</h2>
      <p className="mt-1 text-sm text-slate-500">
        Например: колодка, тормозные колодки, brake pad
      </p>
      <form onSubmit={add} className="mt-4 flex gap-2">
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="min-w-0 flex-1 rounded border p-2"
          placeholder="Новый синоним"
          maxLength={200}
        />
        <button
          disabled={busy || !value.trim()}
          className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        >
          Добавить
        </button>
      </form>
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      <ul className="mt-4 divide-y">
        {aliases.map((alias) => (
          <li
            key={alias.id}
            className="flex items-center justify-between gap-3 py-2"
          >
            <span>
              {alias.alias}
              <small className="ml-2 text-slate-400">
                {alias.normalizedAlias}
              </small>
            </span>
            <button
              type="button"
              onClick={() => void remove(alias.id)}
              className="text-sm text-red-700"
            >
              Удалить
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
