'use client';

import { FormEvent, ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { ProtectedLayout } from '../../components/protected-layout';
import {
  getPartCategories,
  getPartNumberManufacturers,
  getShops,
  MarketplaceSearchParams,
  MarketplaceSearchResponse,
  marketplaceSearch,
  PartCategoryOption,
  PartNumberManufacturer,
  Shop,
} from '../../lib/api';

type Filters = Omit<MarketplaceSearchParams, 'q' | 'page' | 'limit'>;

const initialFilters: Filters = {
  inStockOnly: true,
  originalOnly: false,
  analogOnly: false,
};

function SearchSkeleton() {
  return (
    <div className="grid gap-4 xl:grid-cols-2" aria-label="Загрузка результатов">
      {Array.from({ length: 6 }).map((_, index) => (
        <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5" key={index}>
          <div className="flex gap-4">
            <div className="h-24 w-28 rounded-xl bg-slate-200" />
            <div className="flex-1 space-y-3">
              <div className="h-5 w-3/4 rounded bg-slate-200" />
              <div className="h-4 w-1/2 rounded bg-slate-100" />
              <div className="h-4 w-2/3 rounded bg-slate-100" />
            </div>
          </div>
          <div className="mt-5 h-12 rounded-xl bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

function EmptyResults() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-slate-100 text-2xl">⌕</div>
      <h2 className="mt-5 text-xl font-semibold text-slate-900">Ничего не найдено</h2>
      <p className="mx-auto mt-2 max-w-md text-slate-500">
        Проверьте номер, измените название детали или ослабьте выбранные фильтры.
      </p>
    </div>
  );
}

export default function MarketplaceSearchPage() {
  const [query, setQuery] = useState('');
  const submittedQuery = useRef('');
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [result, setResult] = useState<MarketplaceSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [manufacturers, setManufacturers] = useState<PartNumberManufacturer[]>([]);
  const [categories, setCategories] = useState<PartCategoryOption[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const filtersReady = useRef(false);

  const runSearch = useCallback(async (searchQuery: string, page: number, nextFilters: Filters) => {
    setLoading(true);
    setError('');
    try {
      setResult(await marketplaceSearch({
        q: searchQuery,
        ...nextFilters,
        minQuantity: nextFilters.minQuantity || undefined,
        page,
        limit: 12,
      }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Не удалось выполнить поиск');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.all([
      getPartNumberManufacturers(),
      getPartCategories({ limit: 100, isActive: true }),
      getShops(),
    ]).then(([manufacturerItems, categoryItems, shopItems]) => {
      setManufacturers(manufacturerItems);
      setCategories(categoryItems.data);
      setShops(shopItems.filter((shop) => shop.isActive));
    }).catch(() => {
      // Поиск остаётся рабочим, даже если справочник одного из фильтров недоступен.
    });
  }, []);

  useEffect(() => {
    if (!filtersReady.current) {
      filtersReady.current = true;
      return;
    }
    if (!submittedQuery.current) return;
    const timer = window.setTimeout(() => {
      void runSearch(submittedQuery.current, 1, filters);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [filters, runSearch]);

  function submit(event: FormEvent) {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;
    submittedQuery.current = value;
    void runSearch(value, 1, filters);
  }

  function patchFilters(patch: Partial<Filters>) {
    setFilters((current) => ({ ...current, ...patch }));
  }

  return (
    <ProtectedLayout>
      <div className="mx-auto max-w-[1500px]">
        <header>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">AutoStock Marketplace</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Поиск запчастей по всем магазинам</h1>
          <p className="mt-2 text-slate-500">VIN, оригинальные номера, аналоги и единый каталог AutoStock.</p>
        </header>

        <form className="mt-7 flex rounded-2xl border border-slate-200 bg-white p-2 shadow-sm focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-50" onSubmit={submit}>
          <input
            aria-label="Поисковый запрос"
            className="min-w-0 flex-1 bg-transparent px-5 py-4 text-lg outline-none placeholder:text-slate-400"
            placeholder="Введите VIN, OEM, Cross, название детали..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button className="rounded-xl bg-blue-700 px-8 py-4 font-semibold text-white transition hover:bg-blue-800 disabled:opacity-60" disabled={loading || !query.trim()}>
            Поиск
          </button>
        </form>

        {error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>}

        {result?.vehicle && (
          <section className="mt-6 overflow-hidden rounded-2xl bg-slate-950 p-6 text-white shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">Автомобиль по VIN</p>
                <h2 className="mt-2 text-2xl font-bold">
                  {[result.vehicle.vehicle.manufacturer, result.vehicle.vehicle.model, result.vehicle.vehicle.generation].filter(Boolean).join(' ')}
                </h2>
                <p className="mt-2 text-slate-300">
                  {result.vehicle.vehicle.engineCode ?? 'Двигатель не определён'} · {result.vehicle.vehicle.year ?? 'Год не определён'} · {result.vehicle.vehicle.vin}
                </p>
              </div>
              <span className={`rounded-full px-4 py-2 text-sm font-bold ${
                result.vehicle.matchStatus === 'FOUND' ? 'bg-emerald-400/20 text-emerald-300' :
                result.vehicle.matchStatus === 'PARTIAL' ? 'bg-amber-400/20 text-amber-300' :
                'bg-slate-700 text-slate-200'
              }`}>
                {result.vehicle.matchStatus}
              </span>
            </div>
          </section>
        )}

        <div className="mt-7 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-6">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-950">Фильтры</h2>
              <button className="text-sm font-medium text-blue-700" type="button" onClick={() => setFilters(initialFilters)}>Сбросить</button>
            </div>
            <div className="mt-5 space-y-4">
              {[
                ['inStockOnly', 'Только в наличии'],
                ['originalOnly', 'Только оригинал'],
                ['analogOnly', 'Только аналоги'],
              ].map(([key, label]) => (
                <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-700" key={key}>
                  <input
                    className="h-4 w-4 rounded border-slate-300 accent-blue-700"
                    type="checkbox"
                    checked={Boolean(filters[key as keyof Filters])}
                    onChange={(event) => patchFilters({ [key]: event.target.checked })}
                  />
                  {label}
                </label>
              ))}
              <label className="block border-t border-slate-100 pt-4 text-sm font-medium text-slate-700">
                Минимальный остаток
                <input className="mt-2 w-full rounded-lg border border-slate-300 p-2.5" min="0" type="number" value={filters.minQuantity ?? ''} onChange={(event) => patchFilters({ minQuantity: event.target.value ? Number(event.target.value) : undefined })} />
              </label>
              <FilterSelect label="Производитель" value={filters.manufacturerId} onChange={(value) => patchFilters({ manufacturerId: value || undefined })}>
                {manufacturers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </FilterSelect>
              <FilterSelect label="Категория" value={filters.categoryId} onChange={(value) => patchFilters({ categoryId: value || undefined })}>
                {categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </FilterSelect>
              <FilterSelect label="Магазин" value={filters.shopId} onChange={(value) => patchFilters({ shopId: value || undefined })}>
                {shops.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </FilterSelect>
            </div>
          </aside>

          <main>
            {result && !loading && (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-950">Найдено предложений: {result.pagination.total}</p>
                  <p className="text-sm text-slate-500">Тип запроса: {result.queryType}</p>
                </div>
                <p className="text-sm text-slate-500">Страница {result.pagination.page} из {result.pagination.totalPages || 1}</p>
              </div>
            )}
            {loading ? <SearchSkeleton /> : result && result.items.length === 0 ? <EmptyResults /> : (
              <div className="grid gap-4 xl:grid-cols-2">
                {result?.items.map((item) => (
                  <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" key={item.inventoryItemId}>
                    <div className="p-5">
                      <div className="flex gap-4">
                        {item.imageUrl ? (
                          <div aria-label={`Фото ${item.name}`} className="h-24 w-28 shrink-0 rounded-xl bg-cover bg-center ring-1 ring-slate-200" style={{ backgroundImage: `url("${item.imageUrl}")` }} />
                        ) : (
                          <div className="grid h-24 w-28 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-center text-xs font-semibold text-slate-500 ring-1 ring-slate-200">AUTOSTOCK<br />PART</div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-blue-700">{item.category.name}</p>
                          <h2 className="mt-1 text-lg font-bold text-slate-950">{item.name}</h2>
                          <p className="mt-1 text-sm text-slate-500">Код: {item.internalCode}</p>
                          <p className="mt-2 text-sm"><span className="text-slate-500">OEM:</span> {item.oemNumbers.join(', ') || '—'}</p>
                          <p className="truncate text-sm"><span className="text-slate-500">Cross:</span> {item.crossNumbers.join(', ') || '—'}</p>
                        </div>
                      </div>
                      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-slate-100 pt-4 text-sm">
                        <CardField label="Производитель" value={item.manufacturer?.name ?? 'Не указан'} />
                        <CardField label="Склад" value={item.warehouse ?? 'Основной склад'} />
                        <CardField label="Совместимость" value={item.compatibility.join(' · ') || 'Не указана'} wide />
                      </dl>
                    </div>
                    <div className="flex items-end justify-between border-t border-slate-100 bg-slate-50 px-5 py-4">
                      <div>
                        <p className="font-semibold text-slate-950">{item.shop.name}</p>
                        <p className="text-sm text-slate-500">{[item.shop.city, item.shop.address].filter(Boolean).join(', ') || 'Адрес не указан'}</p>
                        <p className={`mt-1 text-sm font-medium ${item.quantity > 0 ? 'text-emerald-700' : 'text-red-600'}`}>{item.quantity} шт. в наличии</p>
                      </div>
                      <p className="text-right text-2xl font-bold text-slate-950">{item.price}<span className="ml-1 text-sm font-semibold text-slate-500">{item.currency}</span></p>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {result && result.pagination.totalPages > 1 && !loading && (
              <div className="mt-6 flex justify-center gap-3">
                <button className="rounded-lg border border-slate-300 bg-white px-4 py-2 disabled:opacity-40" disabled={result.pagination.page <= 1} onClick={() => void runSearch(submittedQuery.current, result.pagination.page - 1, filters)}>Назад</button>
                <button className="rounded-lg border border-slate-300 bg-white px-4 py-2 disabled:opacity-40" disabled={result.pagination.page >= result.pagination.totalPages} onClick={() => void runSearch(submittedQuery.current, result.pagination.page + 1, filters)}>Далее</button>
              </div>
            )}
          </main>
        </div>
      </div>
    </ProtectedLayout>
  );
}

function FilterSelect({ label, value, onChange, children }: { label:string;value?:string;onChange:(value:string)=>void;children:ReactNode }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <select className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-2.5" value={value ?? ''} onChange={(event) => onChange(event.target.value)}>
        <option value="">Все</option>
        {children}
      </select>
    </label>
  );
}

function CardField({ label, value, wide = false }: { label:string;value:string;wide?:boolean }) {
  return <div className={wide ? 'col-span-2' : ''}><dt className="text-slate-400">{label}</dt><dd className="mt-0.5 line-clamp-2 font-medium text-slate-700">{value}</dd></div>;
}
