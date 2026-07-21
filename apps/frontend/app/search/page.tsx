'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedLayout } from '../../components/protected-layout';
import { ApiError, searchInventory, SearchResponse } from '../../lib/api';
import { getUser } from '../../lib/auth';

export default function SearchPage() {
  const router = useRouter();
  const [user, setUser] = useState<ReturnType<typeof getUser>>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [query, setQuery] = useState('');
  const [inStock, setInStock] = useState(true);
  const [shopId, setShopId] = useState('');
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    queueMicrotask(() => {
      setUser(getUser());
      setAuthLoaded(true);
    });
  }, []);

  async function load(targetPage = page) {
    setLoading(true);
    setError('');

    try {
      const response = await searchInventory({
        q: query.trim() || undefined,
        inStockOnly: inStock,
        page: targetPage,
        limit: 20,
        shopId: user?.role === 'SUPER_ADMIN' ? shopId || undefined : undefined,
      });

      setResult(response);
      setPage(targetPage);
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        router.replace('/login');
        return;
      }

      setError(
        requestError instanceof Error ? requestError.message : 'Ошибка поиска',
      );
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void load(1);
  }

  return (
    <ProtectedLayout>
      <h1 className="text-2xl font-bold">Поиск запчастей</h1>

      <form
        onSubmit={submit}
        className="mt-6 grid gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:grid-cols-[1fr_auto_auto]"
      >
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="rounded border border-slate-300 p-3"
          placeholder="Название, код или OEM"
        />
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={inStock}
            onChange={(event) => setInStock(event.target.checked)}
          />
          Только в наличии
        </label>
        {authLoaded && user?.role === 'SUPER_ADMIN' && (
          <input
            value={shopId}
            onChange={(event) => setShopId(event.target.value)}
            className="rounded border border-slate-300 p-3"
            placeholder="ID магазина"
          />
        )}
        <button
          disabled={loading}
          className="rounded bg-blue-600 px-5 py-3 text-white disabled:opacity-60"
        >
          {loading ? 'Поиск…' : 'Найти'}
        </button>
      </form>

      {error && (
        <p role="alert" className="mt-4 text-red-700">
          {error}
        </p>
      )}
      {loading && <p className="mt-6">Загрузка…</p>}

      {result && !loading && (
        <>
          <p className="mt-6 text-slate-500">
            Найдено: {result.pagination.total}
          </p>
          <div className="mt-3 grid gap-3">
            {result.items.map((item) => (
              <article
                key={item.inventoryItemId}
                className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
              >
                <div className="flex justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">{item.name}</h2>
                    <p className="text-sm text-slate-500">
                      Код: {item.internalCode} · OEM: {item.oemNumber ?? '—'}
                    </p>
                  </div>
                  <strong>{item.price} TJS</strong>
                </div>
                <p className="mt-3 text-sm">
                  Категория: {item.category.name} · Производитель:{' '}
                  {item.manufacturer?.name ?? '—'} · Магазин: {item.shop.name}
                </p>
                <p className="text-sm">
                  Остаток: {item.quantity} · Доступно: {item.availableQuantity}
                </p>
              </article>
            ))}
          </div>

          {result.items.length === 0 && (
            <p className="mt-6 text-slate-500">Ничего не найдено.</p>
          )}

          <div className="mt-6 flex gap-3">
            <button
              disabled={page <= 1 || loading}
              onClick={() => void load(page - 1)}
              className="rounded border border-slate-300 px-3 py-2 disabled:opacity-40"
            >
              Назад
            </button>
            <span className="py-2">
              Страница {page} из {result.pagination.totalPages || 1}
            </span>
            <button
              disabled={page >= result.pagination.totalPages || loading}
              onClick={() => void load(page + 1)}
              className="rounded border border-slate-300 px-3 py-2 disabled:opacity-40"
            >
              Далее
            </button>
          </div>
        </>
      )}
    </ProtectedLayout>
  );
}
