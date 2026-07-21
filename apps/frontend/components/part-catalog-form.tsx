'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  ApiError,
  createPartCatalogItem,
  getPartCategories,
  getPartCatalogCandidates,
  PartCatalogEntry,
  PartCatalogPayload,
  updatePartCatalogItem,
} from '../lib/api';
import { createSlug } from '../lib/slug';

const empty: PartCatalogPayload = {
  name: '',
  slug: '',
  categoryId: '',
  side: 'NONE',
  position: 'NONE',
  isUniversal: false,
  isActive: true,
};

export function PartCatalogForm({ initial, onSuccess }: { initial?: PartCatalogEntry; onSuccess: () => void }) {
  const [value, setValue] = useState<PartCatalogPayload>(
    initial
      ? {
          name: initial.name,
          slug: initial.slug,
          description: initial.description ?? undefined,
          categoryId: initial.categoryId,
          side: initial.side,
          position: initial.position,
          isUniversal: initial.isUniversal,
          isActive: initial.isActive,
        }
      : empty,
  );
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string; _count: { children: number } }[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [candidates, setCandidates] = useState<{ name: string; internalCode: string; matchType: string }[]>([]);

  useEffect(() => {
    void getPartCategories()
      .then((result) => setCategories(result.data.filter((category) => category._count.children === 0)))
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'Не удалось загрузить категории'));
  }, []);

  useEffect(() => {
    if (value.name.trim().length < 3 || !value.categoryId) return;
    const timer = window.setTimeout(
      () =>
        void getPartCatalogCandidates({
          q: value.name,
          categoryId: value.categoryId,
          side: value.side,
          position: value.position,
        })
          .then((result) => setCandidates(result.items))
          .catch(() => setCandidates([])),
      400,
    );
    return () => clearTimeout(timer);
  }, [value.name, value.categoryId, value.side, value.position]);

  function updateName(name: string) {
    setValue((current) => ({
      ...current,
      name,
      slug: slugManuallyEdited ? current.slug : createSlug(name),
    }));
  }

  function regenerateSlug() {
    setSlugManuallyEdited(false);
    setValue((current) => ({ ...current, slug: createSlug(current.name) }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      if (initial) await updatePartCatalogItem(initial.id, value);
      else await createPartCatalogItem(value);
      onSuccess();
    } catch (reason) {
      setError(
        reason instanceof ApiError && reason.status === 409
          ? 'Похожая позиция уже существует. Проверьте предупреждения ниже.'
          : reason instanceof Error
            ? reason.message
            : 'Не удалось сохранить позицию',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-5 max-w-2xl rounded-xl bg-white p-5 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          Название *
          <input required value={value.name} onChange={(event) => updateName(event.target.value)} className="mt-1 w-full rounded border p-2" />
        </label>
        <label className="block text-sm">
          Slug *
          <div className="mt-1 flex gap-2">
            <input required value={value.slug} onChange={(event) => { setSlugManuallyEdited(true); setValue((current) => ({ ...current, slug: event.target.value })); }} className="min-w-0 flex-1 rounded border p-2" />
            <button type="button" onClick={regenerateSlug} className="shrink-0 rounded border px-3 text-sm hover:bg-slate-50">↺ Сгенерировать</button>
          </div>
        </label>
        <label className="text-sm">
          Категория *
          <select required value={value.categoryId} onChange={(event) => setValue((current) => ({ ...current, categoryId: event.target.value }))} className="mt-1 w-full rounded border p-2">
            <option value="">Выберите конечную категорию</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </label>
        <label className="text-sm">
          Сторона
          <select value={value.side} onChange={(event) => setValue((current) => ({ ...current, side: event.target.value as PartCatalogPayload['side'] }))} className="mt-1 w-full rounded border p-2">
            <option value="NONE">Не указана</option><option value="LEFT">Левая</option><option value="RIGHT">Правая</option>
          </select>
        </label>
        <label className="text-sm">
          Положение
          <select value={value.position} onChange={(event) => setValue((current) => ({ ...current, position: event.target.value as PartCatalogPayload['position'] }))} className="mt-1 w-full rounded border p-2">
            <option value="NONE">Не указано</option><option value="FRONT">Переднее</option><option value="REAR">Заднее</option>
          </select>
        </label>
        <label className="block text-sm">
          Описание
          <input value={value.description ?? ''} onChange={(event) => setValue((current) => ({ ...current, description: event.target.value || undefined }))} className="mt-1 w-full rounded border p-2" />
        </label>
        <label className="flex gap-2 text-sm"><input type="checkbox" checked={value.isUniversal} onChange={(event) => setValue((current) => ({ ...current, isUniversal: event.target.checked }))} />Универсальная деталь</label>
        <label className="flex gap-2 text-sm"><input type="checkbox" checked={value.isActive} onChange={(event) => setValue((current) => ({ ...current, isActive: event.target.checked }))} />Активна</label>
      </div>
      {candidates.length > 0 && <div className="mt-4 rounded bg-amber-50 p-3 text-sm"><b>Возможные совпадения</b>{candidates.map((candidate) => <p key={candidate.internalCode}>{candidate.name} · {candidate.internalCode} ({candidate.matchType})</p>)}</div>}
      {error && <p className="mt-4 text-red-700">{error}</p>}
      <button disabled={busy} className="mt-5 rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50">{busy ? 'Сохранение…' : 'Сохранить'}</button>
    </form>
  );
}
