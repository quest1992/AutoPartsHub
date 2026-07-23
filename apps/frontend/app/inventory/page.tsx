'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ProtectedLayout } from '../../components/protected-layout';
import {
  deleteInventory,
  inventoryList,
  InventoryList,
} from '../../lib/api';

export default function InventoryPage() {
  const [q, setQ] = useState('');
  const [active, setActive] = useState('true');
  const [data, setData] = useState<InventoryList | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');

  const load = useCallback(
    async (nextPage: number) => {
      try {
        setError('');
        const result = await inventoryList({
          search: q.trim() || undefined,
          isActive: active === '' ? undefined : active,
          page: nextPage,
          limit: 20,
        });
        setData(result);
        setPage(nextPage);
      } catch (reason) {
        setError(
          reason instanceof Error ? reason.message : 'Ошибка загрузки',
        );
      }
    },
    [q, active],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load(1);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [load]);

  async function remove(id: string) {
    if (confirm('Отключить этот товар?')) {
      await deleteInventory(id);
      await load(1);
    }
  }

  const totalPages = data?.meta.totalPages ?? 1;
  const totalItems = data?.meta.total ?? 0;

  return (
    <ProtectedLayout>
      <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">Складской учёт</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              Товары
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Управляйте складскими позициями, ценами и остатками магазина.
            </p>
          </div>

          <Link
            href="/inventory/new"
            className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 sm:self-auto"
          >
            <span aria-hidden="true" className="text-lg leading-none">
              +
            </span>
            Добавить товар
          </Link>
        </header>

        <section className="mt-7 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-slate-800">
              Поиск и фильтры
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Найдите товар по названию, бренду, артикулу или OEM-номеру.
            </p>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(280px,1fr)_220px_auto]">
            <div className="relative">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400"
              >
                ⌕
              </span>
              <input
                value={q}
                onChange={(event) => setQ(event.target.value)}
                onKeyDown={(event) =>
                  event.key === 'Enter' && void load(1)
                }
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 hover:border-slate-300 focus:bg-white"
                placeholder="Название, бренд, артикул или OEM"
              />
            </div>

            <select
              value={active}
              onChange={(event) => setActive(event.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-sm text-slate-700 hover:border-slate-300 focus:bg-white"
            >
              <option value="true">Только активные</option>
              <option value="false">Отключённые</option>
              <option value="">Все товары</option>
            </select>

            <button
              type="button"
              onClick={() => void load(1)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50"
            >
              Найти
            </button>
          </div>
        </section>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="font-semibold text-slate-900">Складские позиции</h2>
              <p className="mt-1 text-xs text-slate-500">
                Найдено товаров: {totalItems}
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              Страница {page} из {totalPages}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="bg-slate-50/80">
                <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3.5">Товар</th>
                  <th className="px-5 py-3.5">Категория / автомобиль</th>
                  <th className="px-5 py-3.5">Цена</th>
                  <th className="px-5 py-3.5">Остаток</th>
                  <th className="px-5 py-3.5 text-right">Действия</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {data?.data.map((item) => {
                  const identifier = item.sku ?? item.oemNumber ?? '—';

                  return (
                    <tr
                      key={item.id}
                      className="group bg-white transition-colors hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-5 align-middle">
                        <div className="flex items-center gap-3">
                          {item.imageUrl ? (
                            <div
                              role="img"
                              aria-label={`Фото ${item.partCatalogItem.name}`}
                              className="h-12 w-12 shrink-0 rounded-lg border border-slate-200 bg-cover bg-center"
                              style={{ backgroundImage: `url("${item.imageUrl}")` }}
                            />
                          ) : (
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-[10px] text-slate-400">
                              Нет фото
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-slate-900">
                              {item.partCatalogItem.name}
                            </p>
                            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                              <span>{item.brand ?? 'Без бренда'}</span>
                              <span aria-hidden="true" className="h-1 w-1 rounded-full bg-slate-300" />
                              <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-600">
                                {identifier}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-5 align-middle">
                        <p className="font-medium text-slate-700">
                          {item.partCatalogItem.category.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.compatibility ? (
                            <span
                              className="line-clamp-2 max-w-md"
                              title={item.compatibility}
                            >
                              {item.compatibility}
                            </span>
                          ) : (
                            <span className="text-slate-400">
                              Совместимость не указана
                            </span>
                          )}
                        </p>
                        <p
                          className={`mt-1.5 text-xs ${
                            item.location ? 'text-slate-600' : 'text-slate-400'
                          }`}
                          title={item.location ?? undefined}
                        >
                          {item.location
                            ? `Место: ${item.location}`
                            : 'Место не указано'}
                        </p>
                      </td>

                      <td className="px-5 py-5 align-middle">
                        <span className="font-semibold tabular-nums text-slate-900">
                          {item.price}
                        </span>{' '}
                        <span className="text-xs font-medium text-slate-500">
                          {item.currency}
                        </span>
                      </td>

                      <td className="px-5 py-5 align-middle">
                        <span
                          className={`inline-flex min-w-12 justify-center rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums ${
                            item.quantity > 5
                              ? 'bg-emerald-50 text-emerald-700'
                              : item.quantity > 0
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {item.quantity}
                        </span>
                      </td>

                      <td className="px-5 py-5 align-middle">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/inventory/${item.id}`}
                            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                          >
                            Изменить
                          </Link>
                          <button
                            type="button"
                            onClick={() => void remove(item.id)}
                            className="inline-flex items-center justify-center rounded-lg border border-red-100 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:border-red-200 hover:bg-red-50"
                          >
                            Удалить
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {data && data.data.length === 0 && (
              <div className="px-6 py-14 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-400">
                  ⌕
                </div>
                <h3 className="mt-4 font-semibold text-slate-800">
                  Товары не найдены
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Попробуйте изменить поисковый запрос или выбранный фильтр.
                </p>
              </div>
            )}
          </div>
        </section>

        <nav
          aria-label="Пагинация товаров"
          className="mt-5 flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-center text-sm text-slate-500 sm:text-left">
            Страница{' '}
            <span className="font-semibold text-slate-800">{page}</span> из{' '}
            <span className="font-semibold text-slate-800">{totalPages}</span>
          </p>

          <div className="grid grid-cols-2 gap-2 sm:flex">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => void load(page - 1)}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-300"
            >
              ← Назад
            </button>
            <button
              type="button"
              disabled={!data || page >= data.meta.totalPages}
              onClick={() => void load(page + 1)}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-300"
            >
              Далее →
            </button>
          </div>
        </nav>
      </div>
    </ProtectedLayout>
  );
}
