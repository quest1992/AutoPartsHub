'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  ApiError,
  CatalogCategoryMatch,
  CatalogItem,
  PartCategoryOption,
  catalogSearch,
  createCatalogSuggestion,
  getPartCategories,
} from '../lib/api';

export function CatalogPicker({
  value,
  onChange,
  readOnly = false,
}: {
  value: CatalogItem | null;
  onChange: (item: CatalogItem | null) => void;
  readOnly?: boolean;
}) {
  const [q, setQ] = useState('');
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [categoryMatches, setCategoryMatches] = useState<CatalogCategoryMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [categories, setCategories] = useState<PartCategoryOption[]>([]);
  const [form, setForm] = useState({ name: '', suggestedCategoryId: '', oemNumber: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (q.trim().length < 2) return;
    const timer = setTimeout(() => {
      setLoading(true);
      setError('');
      catalogSearch(q.trim())
        .then((result) => {
          setItems(result.data);
          setCategoryMatches(result.categoryMatches ?? []);
        })
        .catch((cause) => setError(cause instanceof ApiError ? cause.message : 'Ошибка поиска'))
        .finally(() => setLoading(false));
    }, 400);
    return () => clearTimeout(timer);
  }, [q]);

  const details = (item: CatalogItem) => {
    const generation = item.compatibilities[0]?.vehicleGeneration;
    return `${item.category.name}${generation ? ` · ${generation.vehicleModel.manufacturer.name} ${generation.vehicleModel.name} ${generation.name}` : ''}`;
  };

  function openForm() {
    setForm((current) => ({ ...current, name: q.trim() }));
    setShowForm(true);
    if (!categories.length) {
      getPartCategories({ limit: 100, leafOnly: true, isActive: true })
        .then((result) => setCategories(result.data))
        .catch(() => setError('Не удалось загрузить категории'));
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await createCatalogSuggestion({
        name: form.name,
        suggestedCategoryId: form.suggestedCategoryId || undefined,
        oemNumber: form.oemNumber || undefined,
        description: form.description || undefined,
      });
      setMessage('Предложение отправлено на модерацию');
      setShowForm(false);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Не удалось отправить предложение');
    } finally {
      setSaving(false);
    }
  }

  if (value) {
    return (
      <div className="rounded border border-blue-200 bg-blue-50 p-3">
        <b>{value.name}</b>
        <p className="text-sm">{value.internalCode} · {details(value)}</p>
        {!readOnly && <button type="button" onClick={() => onChange(null)} className="mt-2 text-sm text-blue-700">Изменить выбор</button>}
      </div>
    );
  }

  const ready = q.trim().length >= 2;
  const trueCategoryMatches = categoryMatches.filter((match) => !match.isLegacyCatalogItemCategory);

  return (
    <div className="relative">
      <label className="block text-sm">
        Найти запчасть в каталоге
        <input
          value={q}
          onChange={(event) => {
            setQ(event.target.value);
            setMessage('');
            if (event.target.value.trim().length < 2) {
              setItems([]);
              setCategoryMatches([]);
            }
          }}
          className="mt-1 w-full rounded border border-slate-300 p-2"
          placeholder="Название, код или OEM"
        />
      </label>
      {q && !ready && <p className="mt-1 text-xs text-slate-500">Введите минимум 2 символа</p>}
      {loading && <p className="mt-1 text-sm">Поиск…</p>}
      {error && <p className="mt-1 text-sm text-red-700">{error}</p>}
      {message && <p className="mt-2 rounded bg-green-50 p-2 text-sm text-green-800">{message}</p>}
      {ready && items.length > 0 && (
        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded border bg-white shadow">
          {items.map((item) => (
            <button type="button" key={item.id} onClick={() => { onChange(item); setQ(''); }} className="block w-full border-b p-3 text-left hover:bg-slate-50">
              <b>{item.name}</b><br />
              <span className="text-sm text-slate-500">{item.internalCode} · {details(item)}</span>
            </button>
          ))}
        </div>
      )}
      {ready && !loading && trueCategoryMatches.length > 0 && (
        <div className="mt-2 rounded border border-amber-200 bg-amber-50 p-3 text-sm">
          {trueCategoryMatches.map((match) => (
            <p key={match.categoryId}>
              Категория «{match.path}»: {match.catalogItemCount
                ? `найдено позиций каталога: ${match.catalogItemCount}`
                : 'позиций каталога пока нет'}.
            </p>
          ))}
        </div>
      )}
      {ready && !loading && !error && items.length === 0 && categoryMatches.length === 0 && (
        <div className="mt-2 rounded border border-dashed border-slate-300 p-3 text-sm">
          <p>Такой позиции нет в центральном каталоге.</p>
          <button type="button" onClick={openForm} className="mt-2 rounded bg-blue-600 px-3 py-2 text-white">Предложить новую позицию</button>
        </div>
      )}
      {showForm && (
        <form onSubmit={submit} className="mt-3 grid gap-3 rounded border bg-white p-4 shadow">
          <h3 className="font-semibold">Новая позиция каталога</h3>
          <label className="text-sm">Название<input required minLength={2} maxLength={200} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1 w-full rounded border p-2" /></label>
          <label className="text-sm">Категория<select value={form.suggestedCategoryId} onChange={(event) => setForm({ ...form, suggestedCategoryId: event.target.value })} className="mt-1 w-full rounded border p-2"><option value="">Не выбрана</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
          <label className="text-sm">OEM<input maxLength={100} value={form.oemNumber} onChange={(event) => setForm({ ...form, oemNumber: event.target.value })} className="mt-1 w-full rounded border p-2" /></label>
          <label className="text-sm">Описание<textarea maxLength={2000} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="mt-1 w-full rounded border p-2" /></label>
          <div className="flex gap-2">
            <button disabled={saving} className="rounded bg-blue-600 px-3 py-2 text-white">{saving ? 'Отправка…' : 'Отправить'}</button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded border px-3 py-2">Отмена</button>
          </div>
        </form>
      )}
    </div>
  );
}
